import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadItem(); }, [id]);

  async function loadItem() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('item:getById', { id });
      if (result.success && result.data) { setItem(result.data); }
      else { setError(result.error || 'Item not found'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;
  if (error) return <div style={{ padding: 'var(--spacing-xl)' }}><p className="alert alert-error">{error}</p></div>;
  if (!item) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Item not found</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>{item.name}</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Link to={`/items/${item.id}/edit`} className="btn btn-primary">Edit</Link>
          <Link to="/items" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
      <div className="data-card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <h4>Details</h4>
            {item.sku && <p><strong>SKU:</strong> {item.sku}</p>}
            {item.hsnCode && <p><strong>HSN:</strong> {item.hsnCode}</p>}
            <p><strong>Unit:</strong> {item.unit}</p>
          </div>
          <div>
            <h4>Pricing</h4>
            <p><strong>Purchase:</strong> ₹{item.purchasePrice}</p>
            <p><strong>Selling:</strong> ₹{item.sellingPrice}</p>
            <p><strong>Tax Rate:</strong> {item.taxRate}%</p>
          </div>
        </div>
      </div>
      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <h4>Inventory</h4>
        <p><strong>Opening Stock:</strong> {item.openingStock} {item.unit}</p>
        <p><strong>Low Stock Alert:</strong> {item.lowStockAlert} {item.unit}</p>
      </div>
    </div>
  );
}