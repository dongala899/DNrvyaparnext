import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PaymentListPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { loadPayments(); }, []);

  async function loadPayments() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      if (!commandBus) throw new Error('Command bus not available');
      const result = await commandBus.invoke('payment:getList', { limit: 200 });
      if (result.success) { setPayments(result.data); }
      else { setError(result.error || 'Failed to load payments'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const filtered = payments.filter(p => {
    const matchSearch = !search || (p.referenceNumber || '').toLowerCase().includes(search.toLowerCase()) || (p.notes || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Payments</h1>
        <Link to="/payments/new" className="btn btn-primary">Record Payment</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <input type="text" placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ maxWidth: '300px' }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input" style={{ maxWidth: '150px' }}>
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      {loading ? <p>Loading payments...</p> : filtered.length === 0 ? <p>No payments found. <Link to="/payments/new">Record your first payment</Link></p> : (
        <div className="data-list">
          {filtered.map(p => (
            <div key={p.id} className="data-card" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3><Link to={`/payments/${p.id}`}>₹{p.amount}</Link></h3>
                  <p>{p.paymentMode.toUpperCase()} • {p.paymentDate?.split('T')[0]}</p>
                  {p.referenceNumber && <p>Ref: {p.referenceNumber}</p>}
                </div>
                <div><Link to={`/payments/${p.id}`} className="btn btn-secondary btn-sm">View</Link></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}