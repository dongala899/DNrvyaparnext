import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function InvoiceFormPage() {
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    invoiceNumber: '', customerId: '', customerName: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    poNumber: '', poDate: '', shippingAddress: '',
    customerPurchaseOrderId: '', roundOff: true,
    quotationId: '', notes: '', terms: '', status: 'draft',
    lines: [{ id: crypto.randomUUID(), itemId: '', itemName: '', quantity: 1, rate: 0, discount: 0, gstRate: 18, subtotal: 0, total: 0 }],
  });
  const [customers, setCustomers] = useState([]);
  const [customerPos, setCustomerPos] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
    loadItems();
    if (isEdit) loadInvoice();
  }, [id]);

  async function loadCustomers() {
    try {
      const bus = window.__shell?.commandBus;
      const res = await bus.invoke('customer:getList');
      if (res.success) setCustomers(res.data);
    } catch (err) {}
  }

  async function loadItems() {
    try {
      const bus = window.__shell?.commandBus;
      const res = await bus.invoke('item:getList');
      if (res.success) setItems(res.data);
    } catch (err) {}
  }

  async function loadCustomerPos(customerId) {
    if (!customerId) { setCustomerPos([]); return; }
    try {
      const bus = window.__shell?.commandBus;
      const res = await bus.invoke('customerOrder:getList', { customerId, status: 'confirmed' });
      if (res.success) setCustomerPos(res.data);
      else setCustomerPos([]);
    } catch (err) { setCustomerPos([]); }
  }

  async function loadInvoice() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('invoice:getById', { id });
      if (result.success && result.data) {
        const d = result.data;
        setFormData({
          invoiceNumber: d.invoiceNumber, customerId: d.customerId, customerName: d.customerName || '',
          date: d.date?.split('T')[0] || '', dueDate: d.dueDate?.split('T')[0] || '',
          poNumber: d.poNumber || '', poDate: d.poDate?.split('T')[0] || '',
          shippingAddress: d.shippingAddress || '',
          customerPurchaseOrderId: d.customerPurchaseOrderId || '',
          roundOff: d.roundOff !== false,
          quotationId: d.quotationId || '', notes: d.notes || '', terms: d.terms || '', status: d.status,
          lines: d.lines || [],
        });
        if (d.customerId) loadCustomerPos(d.customerId);
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
    loadCustomerPos(customerId);
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

  const addLine = () => { setFormData(prev => ({ ...prev, lines: [...prev.lines, { id: crypto.randomUUID(), itemId: '', itemName: '', quantity: 1, rate: 0, discount: 0, gstRate: 18, subtotal: 0, total: 0 }] })); };
  const removeLine = (idx) => { setFormData(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) })); };

  const computeTotals = () => { const subtotal = formData.lines.reduce((s, l) => s + (l.subtotal || 0), 0); const taxAmount = formData.lines.reduce((s, l) => s + ((l.subtotal || 0) * (l.gstRate || 0) / 100), 0); const discountAmount = formData.lines.reduce((s, l) => s + (l.discount || 0), 0); return { subtotal, taxAmount, discountAmount, totalAmount: subtotal + taxAmount - discountAmount }; };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const commandBus = window.__shell?.commandBus;
      const payload = {
        ...formData,
        poNumber: formData.poNumber || undefined,
        poDate: formData.poDate || undefined,
        shippingAddress: formData.shippingAddress || undefined,
        customerPurchaseOrderId: formData.customerPurchaseOrderId || undefined,
        roundOff: formData.roundOff,
        lines: formData.lines.filter(l => l.itemId).map(l => ({
          itemId: l.itemId, itemName: l.itemName || items.find(i => i.id === l.itemId)?.name,
          description: l.description, hsnSac: l.hsnSac, unit: l.unit,
          quantity: l.quantity, rate: l.rate, discount: l.discount, gstRate: l.gstRate,
        })),
      };
      const result = isEdit ? await commandBus.invoke('invoice:update', { id, data: payload }) : await commandBus.invoke('invoice:create', payload);
      if (result.success) navigate('/invoices');
      else setError(result.error || 'Save failed');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const totals = computeTotals();

  if (loading && isEdit) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '1200px' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label>Invoice #</label>
            <div style={{ padding: '10px 12px', background: '#f1f5f9', borderRadius: '6px', fontWeight: 700, color: '#1e40af', fontSize: '0.95rem' }}>
              {formData.invoiceNumber || 'Auto-generated'}
            </div>
          </div>
          <div className="form-group"><label>Invoice Date *</label><input type="date" name="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} required /></div>
          <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={formData.dueDate} onChange={(e) => setFormData(p => ({ ...p, dueDate: e.target.value }))} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label>Customer *</label>
            <select name="customerId" value={formData.customerId} onChange={handleCustomerChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Shipping Address</label>
            <input type="text" name="shippingAddress" value={formData.shippingAddress} onChange={(e) => setFormData(p => ({ ...p, shippingAddress: e.target.value }))} placeholder="Optional delivery address" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
          <div className="form-group"><label>PO Number</label><input type="text" name="poNumber" value={formData.poNumber} onChange={(e) => setFormData(p => ({ ...p, poNumber: e.target.value }))} placeholder="Customer PO reference" /></div>
          <div className="form-group"><label>PO Date</label><input type="date" name="poDate" value={formData.poDate} onChange={(e) => setFormData(p => ({ ...p, poDate: e.target.value }))} /></div>
          <div className="form-group">
            <label>Customer PO</label>
            <select name="customerPurchaseOrderId" value={formData.customerPurchaseOrderId} onChange={(e) => setFormData(p => ({ ...p, customerPurchaseOrderId: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              <option value="">-- Select --</option>
              {customerPos.map(po => <option key={po.id} value={po.id}>{po.orderNumber}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Round Off</label>
            <select name="roundOff" value={formData.roundOff ? 'yes' : 'no'} onChange={(e) => setFormData(p => ({ ...p, roundOff: e.target.value === 'yes' }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Customer PO (linked)</label>
          <input type="text" name="quotationId" value={formData.quotationId} onChange={(e) => setFormData(p => ({ ...p, quotationId: e.target.value }))} placeholder="Quotation reference (optional)" />
        </div>

        <h4 style={{ marginTop: 'var(--spacing-lg)' }}>Line Items</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--spacing-md)' }}>
           <thead><tr style={{ borderBottom: '2px solid var(--color-border)' }}>
             <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', minWidth: '180px' }}>Item</th>
             <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', width: '80px' }}>HSN</th>
             <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', width: '70px' }}>Qty</th>
             <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', width: '90px' }}>Rate</th>
             <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', width: '80px' }}>Disc</th>
             <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', width: '70px' }}>GST %</th>
             <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', width: '100px' }}>Total</th>
             <th style={{ padding: 'var(--spacing-sm)', width: '40px' }}></th>
           </tr></thead>
          <tbody>
            {formData.lines.map((line, idx) => (
              <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                 <td style={{ padding: 'var(--spacing-sm)' }}><input type="text" value={line.itemName || ''} onChange={(e) => handleLineChange(idx, 'itemName', e.target.value)} placeholder="Item name" /></td>
                 <td style={{ padding: 'var(--spacing-sm)' }}><input type="text" value={line.hsnSac || ''} onChange={(e) => handleLineChange(idx, 'hsnSac', e.target.value)} placeholder="HSN" style={{ width: '70px' }} /></td>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <div className="form-group"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3" /></div>
          <div style={{ border: '1px solid var(--color-border)', padding: 'var(--spacing-md)' }}>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span> <strong>₹{totals.subtotal.toFixed(2)}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax:</span> <strong>₹{totals.taxAmount.toFixed(2)}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount:</span> <strong>-₹{totals.discountAmount.toFixed(2)}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em' }}><span>Total:</span> <strong>₹{totals.totalAmount.toFixed(2)}</strong></p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group"><label htmlFor="status">Status</label><select id="status" name="status" value={formData.status} onChange={handleChange}><option value="draft">Draft</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></div>
          <div className="form-group"><label htmlFor="terms">Terms</label><input type="text" id="terms" name="terms" value={formData.terms} onChange={handleChange} placeholder="e.g., Net 30 days" /></div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          <Link to="/invoices" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}