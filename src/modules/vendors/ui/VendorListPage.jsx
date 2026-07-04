import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function VendorListPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { loadVendors(); }, []);

  async function loadVendors() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      if (!commandBus) throw new Error('Command bus not available');
      const result = await commandBus.invoke('vendor:getList', { limit: 100 });
      if (result.success) { setVendors(result.data); }
      else { setError(result.error || 'Failed to load vendors'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      const commandBus = window.__shell?.commandBus;
      await commandBus.invoke('vendor:delete', { id });
      setVendors(vendors.filter(v => v.id !== id));
    } catch (err) { setError(err.message); console.error('Delete failed:', err); }
  }

  const filtered = vendors.filter(v => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || (v.gstin || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' && v.isActive) || (filter === 'inactive' && !v.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Vendors</h1>
        <Link to="/vendors/new" className="btn btn-primary">Add Vendor</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <input type="text" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ maxWidth: '300px' }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input" style={{ maxWidth: '150px' }}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      {loading ? <p>Loading vendors...</p> : filtered.length === 0 ? <p>No vendors found. <Link to="/vendors/new">Add your first vendor</Link></p> : (
        <div className="data-list">
          {filtered.map(vendor => (
            <div key={vendor.id} className="data-card" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3><Link to={`/vendors/${vendor.id}`}>{vendor.name}</Link></h3>
                  {vendor.gstin && <p>GSTIN: {vendor.gstin}</p>}
                  {vendor.phone && <p>{vendor.phone}</p>}
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <Link to={`/vendors/${vendor.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                  <button onClick={() => handleDelete(vendor.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}