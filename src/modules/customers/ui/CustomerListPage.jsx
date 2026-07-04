import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../../shell/shared-state.js';

export default function CustomerListPage() {
  const currentUser = useStore(s => s.currentUser);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      if (!commandBus) throw new Error('Command bus not available');
      
      const result = await commandBus.invoke('customer:getList', { 
        search: search || undefined,
        limit: 100 
      });
      
      if (result.success) {
        setCustomers(result.data);
      } else {
        setError(result.error || 'Failed to load customers');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const commandBus = window.__shell?.commandBus;
      await commandBus.invoke('customer:delete', { id });
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Delete failed:', err);
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Customers</h1>
        <Link to="/customers/new" className="btn btn-primary">Add Customer</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ maxWidth: '300px' }}
        />
      </div>

      {loading ? (
        <p>Loading customers...</p>
      ) : filteredCustomers.length === 0 ? (
        <p>No customers found. <Link to="/customers/new">Add your first customer</Link></p>
      ) : (
        <div className="data-list">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="data-card" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3><Link to={`/customers/${customer.id}`}>{customer.name}</Link></h3>
                  {customer.email && <p>{customer.email}</p>}
                  {customer.phone && <p>{customer.phone}</p>}
                  {customer.creditLimit > 0 && <p>Credit Limit: ₹{customer.creditLimit}</p>}
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <Link to={`/customers/${customer.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                  <button onClick={() => handleDelete(customer.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}