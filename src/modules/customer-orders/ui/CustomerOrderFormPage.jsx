import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function CustomerOrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [lines, setLines] = useState([{ itemId: '', quantity: 1, rate: 0, discount: 0, gstRate: 18 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => { loadDependencies(); if (isEdit) loadOrder(); else generateNumber(); }, []);

  async function loadDependencies() {
    try {
      const bus = window.__shell?.commandBus;
      const [custRes, itemRes] = await Promise.all([
        bus.invoke('customer:getList'),
        bus.invoke('item:getList'),
      ]);
      if (custRes.success) setCustomers(custRes.data);
      if (itemRes.success) setItems(itemRes.data);
    } catch (err) { setError(err.message); }
  }

  async function generateNumber() {
    try {
      const bus = window.__shell?.commandBus;
      const res = await bus.invoke('customerOrder:getNextNumber');
      if (res.success) setOrderNumber(res.data);
    } catch (err) {}
  }

  async function loadOrder() {
    try {
      const bus = window.__shell?.commandBus;
      const res = await bus.invoke('customerOrder:getById', { id });
      if (res.success) {
        const o = res.data;
        setOrderNumber(o.orderNumber);
        setCustomerId(o.customerId);
        setOrderDate(o.orderDate);
        setExpectedDate(o.expectedDate || '');
        setReference(o.reference || '');
        setNotes(o.notes || '');
        setTerms(o.terms || '');
        setLines(o.lines.map(l => ({ ...l })));
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function updateLine(index, field, value) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: field === 'itemId' ? value : (field === 'itemName' ? value : Number(value) || 0) };
    if (field === 'itemId') {
      const item = items.find(i => i.id === value);
      if (item) {
        updated[index].rate = item.rate || item.sellingRate || 0;
        updated[index].itemName = item.name;
        updated[index].gstRate = item.gstRate || 18;
      }
    }
    if (field === 'quantity' || field === 'rate' || field === 'discount' || field === 'gstRate') {
      updated[index][field] = Number(value) || 0;
    }
    setLines(updated);
  }

  function addLine() {
    setLines([...lines, { itemId: '', quantity: 1, rate: 0, discount: 0, gstRate: 18 }]);
  }

  function removeLine(index) {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});
    const errors = {};
    if (!customerId) errors.customerId = 'Customer is required';
    const validLines = lines.filter(l => l.itemId);
    if (validLines.length === 0) errors.lines = 'At least one line item with an item selection is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaving(false);
      return;
    }

    try {
      const bus = window.__shell?.commandBus;
      const customer = customers.find(c => c.id === customerId);
      const payload = {
        orderNumber,
        customerId,
        customerName: customer?.name || customer?.full_name,
        customerAddress: customer?.address || customer?.city,
        customerPhone: customer?.phone,
        customerEmail: customer?.email,
        customerGstin: customer?.gstin,
        orderDate,
        expectedDate: expectedDate || undefined,
        reference: reference || undefined,
        notes: notes || undefined,
        terms: terms || undefined,
        lines: lines.filter(l => l.itemId).map(l => ({
          itemId: l.itemId,
          itemName: l.itemName || items.find(i => i.id === l.itemId)?.name,
          quantity: l.quantity,
          rate: l.rate,
          discount: l.discount,
          gstRate: l.gstRate,
        })),
      };

      const result = isEdit
        ? await bus.invoke('customerOrder:update', { id, data: payload })
        : await bus.invoke('customerOrder:create', payload);

      if (result.success) navigate('/customer-orders');
      else setError(result.error || 'Save failed');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}>Loading...</div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '900px' }}>
      <h1>{isEdit ? 'Edit Customer Order' : 'New Customer Order'}</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label>Order Number</label>
            <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Customer *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name}</option>)}
            </select>
            {fieldErrors.customerId && <div className="alert alert-error" style={{marginTop:'4px',padding:'6px 8px',fontSize:'0.85em'}}>{fieldErrors.customerId}</div>}
          </div>
          <div className="form-group">
            <label>Order Date *</label>
            <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Expected Delivery</label>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Reference</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PO ref / Enquiry no." />
          </div>
        </div>

        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Line Items</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--spacing-md)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ textAlign: 'left', padding: '4px' }}>Item</th>
              <th style={{ padding: '4px' }}>Qty</th>
              <th style={{ padding: '4px' }}>Rate</th>
              <th style={{ padding: '4px' }}>Disc %</th>
              <th style={{ padding: '4px' }}>GST %</th>
              <th style={{ textAlign: 'right', padding: '4px' }}>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const subtotal = line.quantity * line.rate;
              const discAmt = subtotal * (line.discount || 0) / 100;
              const taxable = subtotal - discAmt;
              const tax = taxable * (line.gstRate || 0) / 100;
              const total = taxable + tax;
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '4px' }}>
                    <select value={line.itemId} onChange={(e) => updateLine(i, 'itemId', e.target.value)} required style={{ minWidth: '180px' }}>
                      <option value="">Select item</option>
                      {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '4px' }}><input type="number" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} min="0.01" step="0.01" style={{ width: '70px' }} /></td>
                  <td style={{ padding: '4px' }}><input type="number" value={line.rate} onChange={(e) => updateLine(i, 'rate', e.target.value)} min="0" step="0.01" style={{ width: '80px' }} /></td>
                  <td style={{ padding: '4px' }}><input type="number" value={line.discount} onChange={(e) => updateLine(i, 'discount', e.target.value)} min="0" max="100" style={{ width: '60px' }} /></td>
                  <td style={{ padding: '4px' }}><input type="number" value={line.gstRate} onChange={(e) => updateLine(i, 'gstRate', e.target.value)} min="0" max="100" style={{ width: '60px' }} /></td>
                  <td style={{ textAlign: 'right', padding: '4px', fontWeight: 600 }}>₹{total.toFixed(2)}</td>
                  <td style={{ padding: '4px' }}><button type="button" onClick={() => removeLine(i)} className="btn btn-sm" disabled={lines.length <= 1}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button type="button" onClick={addLine} className="btn" style={{ marginBottom: 'var(--spacing-lg)' }}>Add Line Item</button>
        {fieldErrors.lines && <div className="alert alert-error" style={{marginTop:'4px',padding:'6px 8px',fontSize:'0.85em'}}>{fieldErrors.lines}</div>}

        <div className="form-group">
          <label>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <div className="form-group">
          <label>Terms & Conditions</label>
          <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} />
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (isEdit ? 'Update Order' : 'Create Order')}</button>
          <button type="button" className="btn" onClick={() => navigate('/customer-orders')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
