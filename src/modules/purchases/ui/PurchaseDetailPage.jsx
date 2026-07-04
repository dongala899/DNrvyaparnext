import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadPurchase(); }, [id]);

  async function loadPurchase() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('purchase:getById', { id });
      if (result.success && result.data) setPurchase(result.data);
      else setError(result.error || 'Purchase not found');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;
  if (error) return <div style={{ padding: 'var(--spacing-xl)' }}><p className="alert alert-error">{error}</p></div>;
  if (!purchase) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Purchase not found</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div><h1>{purchase.billNumber}</h1><p>Status: <strong style={{ textTransform: 'capitalize' }}>{purchase.status}</strong></p><p>Date: {purchase.date}</p></div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Link to={`/purchases/${purchase.id}/edit`} className="btn btn-primary">Edit</Link>
          <Link to="/purchases" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
      <div className="data-card"><p><strong>Vendor:</strong> {purchase.vendorName}</p>{purchase.notes && <p>{purchase.notes}</p>}</div>
      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <h4>Line Items</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--color-border)' }}><th>Item</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
          <tbody>{purchase.lines?.map(line => (<tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}><td>{line.itemName || line.itemId}</td><td style={{ textAlign: 'right' }}>{line.quantity}</td><td style={{ textAlign: 'right' }}>₹{line.rate}</td><td style={{ textAlign: 'right' }}>₹{line.total}</td></tr>))}</tbody>
        </table>
      </div>
      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}><p><strong>Total:</strong> ₹{purchase.totalAmount}</p></div>
    </div>
  );
}