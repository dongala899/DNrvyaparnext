import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      if (!commandBus) throw new Error('Command bus not available');
      const result = await commandBus.invoke('invoice:getList', { limit: 100 });
      if (result.success) { setInvoices(result.data); }
      else { setError(result.error || 'Failed to load invoices'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this invoice?')) return;
    try {
      const commandBus = window.__shell?.commandBus;
      await commandBus.invoke('invoice:cancel', { id });
      setInvoices(invoices.map(i => i.id === id ? { ...i, status: 'cancelled' } : i));
    } catch (err) { setError(err.message); console.error('Cancel failed:', err); }
  }

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || (inv.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || inv.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Invoices</h1>
        <Link to="/invoices/new" className="btn btn-primary">New Invoice</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <input type="text" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ maxWidth: '300px' }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input" style={{ maxWidth: '150px' }}>
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {loading ? <p>Loading invoices...</p> : filtered.length === 0 ? <p>No invoices found. <Link to="/invoices/new">Create your first invoice</Link></p> : (
        <div className="data-list">
          {filtered.map(inv => (
            <div key={inv.id} className="data-card" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3><Link to={`/invoices/${inv.id}`}>{inv.invoiceNumber}</Link></h3>
                  <p>{inv.customerName} • {inv.date}</p>
                  <p>Status: <strong style={{ textTransform: 'capitalize' }}>{inv.status}</strong> • Total: ₹{inv.totalAmount}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  {inv.status !== 'cancelled' && inv.status !== 'confirmed' && <Link to={`/invoices/${inv.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>}
                  {inv.status === 'confirmed' && <button onClick={() => handleCancel(inv.id)} className="btn btn-danger btn-sm">Cancel</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}