import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PoListPage() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { loadPos(); }, []);

  async function loadPos() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('po:getList', { limit: 200 });
      if (result.success) setPos(result.data);
      else setError(result.error || 'Failed to load POs');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const filtered = pos.filter(p => {
    const matchSearch = !search || p.poNumber.toLowerCase().includes(search.toLowerCase()) || (p.vendorName || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Purchase Orders</h1>
        <Link to="/vendor-po/new" className="btn btn-primary">New PO</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <input type="text" placeholder="Search POs..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ maxWidth: '300px' }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input" style={{ maxWidth: '150px' }}>
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {loading ? <p>Loading POs...</p> : filtered.length === 0 ? <p>No POs found. <Link to="/vendor-po/new">Create your first PO</Link></p> : (
        <div className="data-list">
          {filtered.map(p => (
            <div key={p.id} className="data-card" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3><Link to={`/vendor-po/${p.id}`}>{p.poNumber}</Link></h3>
                  <p>{p.vendorName} • {p.date}</p>
                  <p>Status: <strong style={{ textTransform: 'capitalize' }}>{p.status}</strong> • Total: ₹{p.totalAmount}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <Link to={`/vendor-po/${p.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}