import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
    creditLimit: 0,
    creditDays: 0,
    openingBalance: 0,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      loadCustomer();
    }
  }, [id]);

  async function loadCustomer() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('customer:getById', { id });
      if (result.success && result.data) {
        setFormData({
          name: result.data.name || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          address: result.data.address || { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
          creditLimit: result.data.creditLimit || 0,
          creditDays: result.data.creditDays || 0,
          openingBalance: result.data.openingBalance || 0,
          isActive: result.data.isActive ?? true,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const commandBus = window.__shell?.commandBus;
      let result;

      if (isEdit) {
        result = await commandBus.invoke('customer:update', { id, data: formData });
      } else {
        result = await commandBus.invoke('customer:create', formData);
      }

      if (result.success) {
        navigate('/customers');
      } else {
        setError(result.error || 'Save failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading && isEdit) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>
        {isEdit ? 'Edit Customer' : 'New Customer'}
      </h1>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Customer Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <h4 style={{ marginTop: 'var(--spacing-lg)' }}>Address</h4>
        <div className="form-group">
          <label htmlFor="address.line1">Address Line 1</label>
          <input
            type="text"
            id="address.line1"
            name="line1"
            value={formData.address.line1}
            onChange={handleAddressChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address.line2">Address Line 2</label>
          <input
            type="text"
            id="address.line2"
            name="line2"
            value={formData.address.line2}
            onChange={handleAddressChange}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="address.city">City</label>
            <input
              type="text"
              id="address.city"
              name="city"
              value={formData.address.city}
              onChange={handleAddressChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address.state">State</label>
            <input
              type="text"
              id="address.state"
              name="state"
              value={formData.address.state}
              onChange={handleAddressChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address.pincode">PIN Code</label>
            <input
              type="text"
              id="address.pincode"
              name="pincode"
              value={formData.address.pincode}
              onChange={handleAddressChange}
            />
          </div>
        </div>

        <h4 style={{ marginTop: 'var(--spacing-lg)' }}>Credit Terms</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="creditLimit">Credit Limit (₹)</label>
            <input
              type="number"
              id="creditLimit"
              name="creditLimit"
              value={formData.creditLimit}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="creditDays">Credit Days</label>
            <input
              type="number"
              id="creditDays"
              name="creditDays"
              value={formData.creditDays}
              onChange={handleChange}
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="openingBalance">Opening Balance (₹)</label>
          <input
            type="number"
            id="openingBalance"
            name="openingBalance"
            value={formData.openingBalance}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />{' '}
            Active Customer
          </label>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <Link to="/customers" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}