import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function PaymentFormPage() {
  const [formData, setFormData] = useState({ invoiceId: '', customerId: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'cash', referenceNumber: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('payment:create', formData);
      if (result.success) navigate('/payments');
      else setError(result.error || 'Save failed');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '600px' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Record Payment</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="invoiceId">Invoice ID *</label>
          <input type="text" id="invoiceId" name="invoiceId" value={formData.invoiceId} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="customerId">Customer ID</label>
          <input type="text" id="customerId" name="customerId" value={formData.customerId} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (₹) *</label>
          <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} min="0.01" step="0.01" required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="paymentDate">Payment Date</label>
            <input type="date" id="paymentDate" name="paymentDate" value={formData.paymentDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="paymentMode">Payment Mode</label>
            <select id="paymentMode" name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="referenceNumber">Reference / UTR</label>
          <input type="text" id="referenceNumber" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="3" />
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          <Link to="/payments" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}