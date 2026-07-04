import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ItemListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      if (!commandBus) throw new Error('Command bus not available');
      const result = await commandBus.invoke('item:getList', { limit: 100 });
      if (result.success) { setItems(result.data); }
      else { setError(result.error || 'Failed to load items'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this item?')) return;
    try {
      const commandBus = window.__shell?.commandBus;
      await commandBus.invoke('item:delete', { id });
      setItems(items.filter(i => i.id !== id));
    } catch (err) { setError(err.message); console.error('Delete failed:', err); }
  }

  const filtered = items.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' && i.isActive) || (filter === 'inactive' && !i.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Items</h1>
        <Link to="/items/new" className="btn btn-primary">Add Item</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <input type="text" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ maxWidth: '300px' }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input" style={{ maxWidth: '150px' }}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <p>Loading items...</p>
      ) : filtered.length === 0 ? (
        <p>No items found. <Link to="/items/new">Add your first item</Link></p>
      ) : (
        <div className="data-list">
          {filtered.map(item => (
            <div key={item.id} className="data-card" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3><Link to={`/items/${item.id}`}>{item.name}</Link></h3>
                  {item.sku && <p>SKU: {item.sku}</p>}
                  <p>Selling: ₹{item.sellingPrice} | Tax: {item.taxRate}%</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <Link to={`/items/${item.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                  <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}