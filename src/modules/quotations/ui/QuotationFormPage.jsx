import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function QuotationFormPage() {
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    quotationNumber: '', customerId: '', customerName: '',
    date: new Date().toISOString().split('T')[0],
    validityDate: '', notes: '', status: 'draft',
    lines: [{ id: crypto.randomUUID(), itemId: '', itemName: '', quantity: 1, rate: 0, discount: 0, gstRate: 18, subtotal: 0, total: 0 }],
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => { loadCustomers(); if (isEdit) loadQuotation(); }, [id]);

  async function loadCustomers() {
    try {
      const bus = window.__shell?.commandBus;
      const res = await bus.invoke('customer:getList');
      if (res.success) setCustomers(res.data);
    } catch (err) {}
  }

  async function loadQuotation() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('quotation:getById', { id });
      if (result.success && result.data) {
        const d = result.data;
        setFormData({
          quotationNumber: d.quotationNumber, customerId: d.customerId, customerName: d.customerName || '',
          date: d.date?.split('T')[0] || '', validityDate: d.validityDate?.split('T')[0] || '',
          notes: d.notes || '', status: d.status, lines: d.lines || [],
        });
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({ ...prev, customerId, customerName: customer?.name || '' }));
  };

  const handleLineChange = (idx, field, value) => {
    const lines = [...formData.lines];
    lines[idx] = { ...lines[idx], [field]: value };
    if (field === 'rate' || field === 'quantity' || field === 'discount' || field === 'gstRate') {
      const l = lines[idx];
      l.subtotal = l.quantity * l.rate;
      const tax = l.subtotal * (l.gstRate / 100);
      l.total = l.subtotal + tax - l.discount;
    }
    setFormData(prev => ({ ...prev, lines }));
  };

  const addLine = () => {
    setFormData(prev => ({ ...prev, lines: [...prev.lines, { id: crypto.randomUUID(), itemId: '', itemName: '', quantity: 1, rate: 0, discount: 0, gstRate: 18, subtotal: 0, total: 0 }] }));
  };

  const removeLine = (idx) => {
    setFormData(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) }));
  };

  const computeTotals = () => {
    const subtotal = formData.lines.reduce((s, l) => s + (Number(l.subtotal) || 0), 0);
    const taxAmount = formData.lines.reduce((s, l) => s + (Number(l.subtotal || 0) * (Number(l.gstRate) || 0) / 100), 0);
    const discountAmount = formData.lines.reduce((s, l) => s + (Number(l.discount) || 0), 0);
    const totalAmount = subtotal + taxAmount - discountAmount;
    return { subtotal, taxAmount, discountAmount, totalAmount };
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!formData.customerId) errors.customerId = 'Customer is required';
    if (formData.lines.length === 0) errors.lines = 'Add at least one line item';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) { setError('Please fix the errors below'); return; }

    setLoading(true);
    setError('');
    try {
      const commandBus = window.__shell?.commandBus;
      const payload = { ...formData, lines: formData.lines.map(l => ({ ...l, subtotal: l.subtotal || 0, total: l.total || 0 })) };
      const result = isEdit ? await commandBus.invoke('quotation:update', { id, data: payload }) : await commandBus.invoke('quotation:create', payload);
      if (result.success) navigate('/quotations');
      else setError(result.error || 'Save failed');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const totals = computeTotals();

  if (loading && isEdit) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '1200px' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>{isEdit ? 'Edit Quotation' : 'New Quotation'}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {fieldErrors.lines && <div className="alert alert-error">{fieldErrors.lines}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="quotationNumber">Quotation #</label>
            <input type="text" id="quotationNumber" name="quotationNumber" value={formData.quotationNumber} onChange={handleChange} required placeholder="QT/2425/001" />
          </div>
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="validityDate">Valid Till</label>
            <input type="date" id="validityDate" name="validityDate" value={formData.validityDate} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="customerId">Customer</label>
            <select name="customerId" value={formData.customerId} onChange={handleCustomerChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name}</option>)}
            </select>
            {fieldErrors.customerId && <div className="alert alert-error" style={{ marginTop: '4px', padding: '6px 8px', fontSize: '0.85em' }}>{fieldErrors.customerId}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="customerName">Customer Name</label>
            <input type="text" id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} readOnly />
          </div>
        </div>

        <h4 style={{ marginTop: 'var(--spacing-lg)' }}>Line Items</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--spacing-md)' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Item</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Rate</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Discount</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>GST %</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Total</th>
            <th style={{ padding: 'var(--spacing-sm)' }}></th>
          </tr></thead>
          <tbody>
            {formData.lines.map((line, idx) => (
              <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}><input type="text" value={line.itemName || ''} onChange={(e) => handleLineChange(idx, 'itemName', e.target.value)} placeholder="Item name" /></td>
                <td style={{ padding: 'var(--spacing-sm)' }}><input type="number" value={line.quantity} onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))} min="1" style={{ textAlign: 'right' }} /></td>
                <td style={{ padding: 'var(--spacing-sm)' }}><input type="number" value={line.rate} onChange={(e) => handleLineChange(idx, 'rate', Number(e.target.value))} min="0" step="0.01" style={{ textAlign: 'right' }} /></td>
                <td style={{ padding: 'var(--spacing-sm)' }}><input type="number" value={line.discount} onChange={(e) => handleLineChange(idx, 'discount', Number(e.target.value))} min="0" step="0.01" style={{ textAlign: 'right' }} /></td>
                <td style={{ padding: 'var(--spacing-sm)' }}><input type="number" value={line.gstRate} onChange={(e) => handleLineChange(idx, 'gstRate', Number(e.target.value))} min="0" max="100" step="0.5" style={{ textAlign: 'right' }} /></td>
                <td style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>₹{line.total?.toFixed(2) || '0.00'}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}><button type="button" onClick={() => removeLine(idx)} className="btn btn-danger btn-sm">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addLine} className="btn btn-secondary">+ Add Line</button>

        <div style={{ marginTop: 'var(--spacing-lg)', display: 'grid', gridTemplateColumns: '1fr 200px', gap: 'var(--spacing-md)' }}>
          <div className="form-group"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3" /></div>
          <div style={{ border: '1px solid var(--color-border)', padding: 'var(--spacing-md)' }}>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span> <strong>₹{(totals.subtotal || 0).toFixed(2)}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax:</span> <strong>₹{(totals.taxAmount || 0).toFixed(2)}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount:</span> <strong>-₹{(totals.discountAmount || 0).toFixed(2)}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em' }}><span>Total:</span> <strong>₹{(totals.totalAmount || 0).toFixed(2)}</strong></p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="final">Final</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          <Link to="/quotations" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
