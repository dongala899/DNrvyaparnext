import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function QuotationListPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { loadQuotations(); }, []);

  async function loadQuotations() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      if (!commandBus) throw new Error('Command bus not available');
      const result = await commandBus.invoke('quotation:getList', { limit: 100 });
      if (result.success) { setQuotations(result.data); }
      else { setError(result.error || 'Failed to load quotations'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this quotation?')) return;
    try {
      const commandBus = window.__shell?.commandBus;
      await commandBus.invoke('quotation:delete', { id });
      setQuotations(quotations.filter(q => q.id !== id));
    } catch (err) { setError(err.message); console.error('Delete failed:', err); }
  }

  const filtered = quotations.filter(q => {
    const matchSearch = !search || q.quotationNumber.toLowerCase().includes(search.toLowerCase()) || (q.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || q.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Quotations</h1>
        <Link to="/quotations/new" className="btn btn-primary">New Quotation</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <input type="text" placeholder="Search quotations..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ maxWidth: '300px' }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input" style={{ maxWidth: '150px' }}>
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="final">Final</option>
        </select>
      </div>
      {loading ? <p>Loading quotations...</p> : filtered.length === 0 ? <p>No quotations found. <Link to="/quotations/new">Create your first quotation</Link></p> : (
        <div className="data-list">
          {filtered.map(q => (
            <div key={q.id} className="data-card" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3><Link to={`/quotations/${q.id}`}>{q.quotationNumber}</Link></h3>
                  <p>{q.customerName} • {q.date}</p>
                  <p>Status: <strong style={{ textTransform: 'capitalize' }}>{q.status}</strong> • Total: ₹{q.totalAmount}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <Link to={`/quotations/${q.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                  <button onClick={() => handleDelete(q.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}