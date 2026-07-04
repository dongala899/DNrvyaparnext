import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function VendorFormPage() {
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', gstin: '', pan: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India', paymentTerms: '', openingBalance: 0, isActive: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { if (isEdit) loadVendor(); }, [id]);

  async function loadVendor() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('vendor:getById', { id });
      if (result.success && result.data) {
        const d = result.data;
        setFormData({ name: d.name || '', email: d.email || '', phone: d.phone || '', gstin: d.gstin || '', pan: d.pan || '', addressLine1: d.addressLine1 || '', addressLine2: d.addressLine2 || '', city: d.city || '', state: d.state || '', pincode: d.pincode || '', country: d.country || 'India', paymentTerms: d.paymentTerms || '', openingBalance: d.openingBalance || 0, isActive: d.isActive ?? true });
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const commandBus = window.__shell?.commandBus;
      const result = isEdit ? await commandBus.invoke('vendor:update', { id, data: formData }) : await commandBus.invoke('vendor:create', formData);
      if (result.success) navigate('/vendors');
      else setError(result.error || 'Save failed');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (loading && isEdit) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>{isEdit ? 'Edit Vendor' : 'New Vendor'}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label htmlFor="name">Vendor Name *</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} /></div>
          <div className="form-group"><label htmlFor="phone">Phone</label><input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group"><label htmlFor="gstin">GSTIN</label><input type="text" id="gstin" name="gstin" value={formData.gstin} onChange={handleChange} /></div>
          <div className="form-group"><label htmlFor="pan">PAN</label><input type="text" id="pan" name="pan" value={formData.pan} onChange={handleChange} /></div>
        </div>
        <div className="form-group"><label htmlFor="addressLine1">Address Line 1</label><input type="text" id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} /></div>
        <div className="form-group"><label htmlFor="addressLine2">Address Line 2</label><input type="text" id="addressLine2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group"><label htmlFor="city">City</label><input type="text" id="city" name="city" value={formData.city} onChange={handleChange} /></div>
          <div className="form-group"><label htmlFor="state">State</label><input type="text" id="state" name="state" value={formData.state} onChange={handleChange} /></div>
          <div className="form-group"><label htmlFor="pincode">PIN Code</label><input type="text" id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} /></div>
        </div>
        <div className="form-group"><label htmlFor="paymentTerms">Payment Terms</label><input type="text" id="paymentTerms" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} placeholder="e.g., Net 30 days" /></div>
        <div className="form-group"><label htmlFor="openingBalance">Opening Balance (₹)</label><input type="number" id="openingBalance" name="openingBalance" value={formData.openingBalance} onChange={handleChange} min="0" step="0.01" /></div>
        <div className="form-group"><label><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /> Active Vendor</label></div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          <Link to="/vendors" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}