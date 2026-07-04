import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function PoDetailPage() {
  const { id } = useParams();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadPo(); }, [id]);

  async function loadPo() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('po:getById', { id });
      if (result.success && result.data) setPo(result.data);
      else setError(result.error || 'PO not found');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;
  if (error) return <div style={{ padding: 'var(--spacing-xl)' }}><p className="alert alert-error">{error}</p></div>;
  if (!po) return <div style={{ padding: 'var(--spacing-xl)' }}><p>PO not found</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>{po.poNumber}</h1>
          <p>Status: <strong style={{ textTransform: 'capitalize' }}>{po.status}</strong></p>
          <p>Date: {po.date} {po.expectedDate && `| Expected: ${po.expectedDate}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Link to={`/vendor-po/${po.id}/edit`} className="btn btn-primary">Edit</Link>
          <Link to="/vendor-po" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>

      <div className="data-card">
        <p><strong>Vendor:</strong> {po.vendorName}</p>
        {po.notes && <p><strong>Notes:</strong> {po.notes}</p>}
      </div>

      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <h4>Line Items</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Item</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Rate</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Received</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Total</th>
          </tr></thead>
          <tbody>
            {po.lines?.map(line => (
              <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}>{line.itemName || line.itemId}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{line.quantity}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>₹{line.rate}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{line.receivedQuantity}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>₹{line.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 'var(--spacing-md)' }}>
          <div></div>
          <div style={{ border: '1px solid var(--color-border)', padding: 'var(--spacing-md)' }}>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span> <strong>₹{po.subtotal}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax:</span> <strong>₹{po.taxAmount}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em' }}><span>Total:</span> <strong>₹{po.totalAmount}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}