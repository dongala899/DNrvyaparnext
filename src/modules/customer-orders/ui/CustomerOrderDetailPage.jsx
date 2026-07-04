import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function CustomerOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);

  useEffect(() => { loadOrder(); }, []);

  async function loadOrder() {
    try {
      const bus = window.__shell?.commandBus;
      const res = await bus.invoke('customerOrder:getById', { id });
      if (res.success) setOrder(res.data);
      else setError(res.error || 'Order not found');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleConvertToInvoice() {
    if (!window.confirm('Convert this order to an invoice?')) return;
    setConverting(true);
    setError('');
    try {
      const bus = window.__shell?.commandBus;
      const result = await bus.invoke('customerOrder:convertToInvoice', { id });
      if (result.success && result.data?.id) {
        navigate(`/invoices/${result.data.id}`);
      } else {
        setError(result.error || 'Conversion failed');
      }
    } catch (err) { setError(err.message); }
    finally { setConverting(false); }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this order?')) return;
    try {
      const bus = window.__shell?.commandBus;
      const result = await bus.invoke('customerOrder:delete', { id });
      if (result.success) navigate('/customer-orders');
      else setError(result.error || 'Delete failed');
    } catch (err) { setError(err.message); }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}>Loading...</div>;
  if (!order) return <div style={{ padding: 'var(--spacing-xl)' }}>{error || 'Order not found'}</div>;

  const statusColors = { draft: '#f59e0b', confirmed: '#10b981', cancelled: '#ef4444', converted: '#6366f1' };

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>{order.orderNumber}</h1>
          <p style={{ color: statusColors[order.status] || '#666', fontWeight: 600, textTransform: 'uppercase' }}>{order.status}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {order.status !== 'converted' && order.status !== 'cancelled' && (
            <>
              <Link to={`/customer-orders/${id}/edit`} className="btn btn-primary">Edit</Link>
              <button onClick={handleConvertToInvoice} className="btn" style={{ background: '#10b981', color: '#fff' }} disabled={converting}>
                {converting ? 'Converting...' : 'Convert to Invoice'}
              </button>
            </>
          )}
          <Link to={`/customer-orders/${id}/preview`} className="btn">Preview</Link>
          {order.status !== 'converted' && <button onClick={handleDelete} className="btn" style={{ background: '#ef4444', color: '#fff' }}>Delete</button>}
          <Link to="/customer-orders" className="btn">Back</Link>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 'var(--spacing-md)' }}>{error}</div>}

      <div className="data-card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="data-card-header"><h3>Order Details</h3></div>
        <div className="data-card-body">
          <table style={{ width: '100%' }}>
            <tbody>
              <tr><td style={{ fontWeight: 600, width: '160px' }}>Customer</td><td>{order.customerName || '—'}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Order Date</td><td>{order.orderDate}</td></tr>
              {order.expectedDate && <tr><td style={{ fontWeight: 600 }}>Expected Delivery</td><td>{order.expectedDate}</td></tr>}
              {order.reference && <tr><td style={{ fontWeight: 600 }}>Reference</td><td>{order.reference}</td></tr>}
              {order.customerGstin && <tr><td style={{ fontWeight: 600 }}>Customer GSTIN</td><td>{order.customerGstin}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <div className="data-card-header"><h3>Line Items</h3></div>
        <div className="data-card-body">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-xs)' }}>Item</th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>Rate</th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>Disc</th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>Tax</th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.lines || []).map((line, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--spacing-xs)' }}>{line.itemName || line.itemId}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>{line.quantity} {line.unit}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>₹{line.rate?.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>{line.discount || 0}%</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>₹{line.taxAmount?.toFixed(2)} ({line.gstRate}%)</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)', fontWeight: 600 }}>₹{line.total?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--color-border)' }}>
                <td colSpan={4}></td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>Subtotal</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)', fontWeight: 600 }}>₹{order.subtotal?.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={4}></td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>Tax</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>₹{order.taxAmount?.toFixed(2)}</td>
              </tr>
              {order.roundOff !== 0 && (
                <tr>
                  <td colSpan={4}></td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>Round Off</td>
                  <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>₹{order.roundOff?.toFixed(2)}</td>
                </tr>
              )}
              <tr style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                <td colSpan={4}></td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>Total</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-xs)' }}>₹{order.totalAmount?.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {order.notes && (
        <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
          <div className="data-card-header"><h3>Notes</h3></div>
          <div className="data-card-body"><p>{order.notes}</p></div>
        </div>
      )}
    </div>
  );
}
