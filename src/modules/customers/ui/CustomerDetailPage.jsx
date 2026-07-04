import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomer();
  }, [id]);

  async function loadCustomer() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      if (!commandBus) throw new Error('Command bus not available');
      
      const result = await commandBus.invoke('customer:getById', { id });
      
      if (result.success && result.data) {
        setCustomer(result.data);
      } else {
        setError(result.error || 'Customer not found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;
  if (error) return <div style={{ padding: 'var(--spacing-xl)' }}><p className="alert alert-error">{error}</p></div>;
  if (!customer) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Customer not found</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>{customer.name}</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Link to={`/customers/${customer.id}/edit`} className="btn btn-primary">Edit</Link>
          <Link to="/customers" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>

      <div className="data-card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <h4>Contact Info</h4>
            {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
            {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
          </div>
          <div>
            <h4>Credit Terms</h4>
            <p><strong>Credit Limit:</strong> ₹{customer.creditLimit || 0}</p>
            <p><strong>Credit Days:</strong> {customer.creditDays || 0}</p>
            <p><strong>Opening Balance:</strong> ₹{customer.openingBalance || 0}</p>
          </div>
        </div>
      </div>

      {customer.address && (
        <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
          <h4>Address</h4>
          <p>
            {[customer.address?.line1, customer.address?.line2, customer.address?.city, customer.address?.state, customer.address?.pincode]
              .filter(Boolean)
              .join(', ')}
            {customer.address?.country && `, ${customer.address.country}`}
          </p>
        </div>
      )}
    </div>
  );
}