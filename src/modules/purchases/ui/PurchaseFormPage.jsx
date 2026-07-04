import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function PurchaseFormPage() {
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({ billNumber: '', vendorId: '', vendorName: '', date: new Date().toISOString().split('T')[0], dueDate: '', notes: '', status: 'draft', lines: [{ id: crypto.randomUUID(), itemId: '', itemName: '', quantity: 1, rate: 0, discount: 0, taxRate: 18, subtotal: 0, total: 0, inputTaxCredit: true }] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { if (isEdit) loadPurchase(); }, [id]);

  async function loadPurchase() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('purchase:getById', { id });
      if (result.success && result.data) {
        const d = result.data;
        setFormData({ billNumber: d.billNumber, vendorId: d.vendorId, vendorName: d.vendorName || '', date: d.date?.split('T')[0] || '', dueDate: d.dueDate?.split('T')[0] || '', notes: d.notes || '', status: d.status, lines: d.lines || [] });
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (idx, field, value) => {
    const lines = [...formData.lines];
    lines[idx] = { ...lines[idx], [field]: value };
    if (field === 'rate' || field === 'quantity' || field === 'discount' || field === 'taxRate') {
      const l = lines[idx];
      l.subtotal = l.quantity * l.rate;
      l.total = l.subtotal + (l.subtotal * l.taxRate / 100) - l.discount;
    }
    setFormData(prev => ({ ...prev, lines }));
  };

  const addLine = () => { setFormData(prev => ({ ...prev, lines: [...prev.lines, { id: crypto.randomUUID(), itemId: '', itemName: '', quantity: 1, rate: 0, discount: 0, taxRate: 18, subtotal: 0, total: 0, inputTaxCredit: true }] })); };
  const removeLine = (idx) => { setFormData(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) })); };

  const computeTotals = () => { const subtotal = formData.lines.reduce((s, l) => s + (l.subtotal || 0), 0); const taxAmount = formData.lines.reduce((s, l) => s + ((l.subtotal || 0) * (l.taxRate || 0) / 100), 0); const discountAmount = formData.lines.reduce((s, l) => s + (l.discount || 0), 0); return { subtotal, taxAmount, discountAmount, totalAmount: subtotal + taxAmount - discountAmount }; };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const commandBus = window.__shell?.commandBus;
      const payload = { ...formData, lines: formData.lines.map(l => ({ ...l, subtotal: l.subtotal || 0, total: l.total || 0 })) };
      const result = isEdit ? await commandBus.invoke('purchase:update', { id, data: payload }) : await commandBus.invoke('purchase:create', payload);
      if (result.success) navigate('/purchases');
      else setError(result.error || 'Save failed');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const totals = computeTotals();

  if (loading && isEdit) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '1000px' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>{isEdit ? 'Edit Purchase' : 'New Purchase'}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group"><label htmlFor="billNumber">Bill # *</label><input type="text" id="billNumber" name="billNumber" value={formData.billNumber} onChange={handleChange} required /></div>
          <div className="form-group"><label htmlFor="date">Date *</label><input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required /></div>
          <div className="form-group"><label htmlFor="vendorId">Vendor ID *</label><input type="text" id="vendorId" name="vendorId" value={formData.vendorId} onChange={handleChange} required /></div>
        </div>
        <h4 style={{ marginTop: 'var(--spacing-lg)' }}>Line Items</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--spacing-md)' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--color-border)' }}><th>Item</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Total</th><th></th></tr></thead>
          <tbody>
            {formData.lines.map((line, idx) => (
              <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}><input type="text" value={line.itemName || ''} onChange={(e) => handleLineChange(idx, 'itemName', e.target.value)} placeholder="Item name" /></td>
                <td style={{ padding: 'var(--spacing-sm)' }}><input type="number" value={line.quantity} onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))} min="1" style={{ textAlign: 'right', width: '60px' }} /></td>
                <td style={{ padding: 'var(--spacing-sm)' }}><input type="number" value={line.rate} onChange={(e) => handleLineChange(idx, 'rate', Number(e.target.value))} min="0" step="0.01" style={{ textAlign: 'right' }} /></td>
                <td style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>₹{line.total?.toFixed(2) || '0.00'}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}><button type="button" onClick={() => removeLine(idx)} className="btn btn-danger btn-sm">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addLine} className="btn btn-secondary">+ Add Line</button>
        <div className="form-group"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="2" /></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', border: '1px solid var(--color-border)', padding: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}><div style={{ textAlign: 'right' }}><p>Subtotal: ₹{totals.subtotal.toFixed(2)}</p><p>Tax: ₹{totals.taxAmount.toFixed(2)}</p><p style={{ fontSize: '1.2em' }}><strong>Total: ₹{totals.totalAmount.toFixed(2)}</strong></p></div></div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button><Link to="/purchases" className="btn btn-secondary">Cancel</Link></div>
      </form>
    </div>
  );
}