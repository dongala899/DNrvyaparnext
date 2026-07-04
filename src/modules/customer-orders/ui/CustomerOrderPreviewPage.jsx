import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function CustomerOrderPreviewPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadOrder(); }, []);

  async function loadOrder() {
    try {
      const bus = window.__shell?.commandBus;
      const res = await bus.invoke('customerOrder:getById', { id });
      if (res.success) setOrder(res.data);
      else setError(res.error || 'Not found');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handlePrint() {
    window.print();
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}>Loading...</div>;
  if (!order) return <div style={{ padding: 'var(--spacing-xl)' }}>{error || 'Not found'}</div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div className="no-print" style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <button onClick={handlePrint} className="btn btn-primary">Print</button>
        <Link to={`/customer-orders/${id}`} className="btn">Back to Detail</Link>
      </div>

      <div className="print-area" style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '40px', boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #1e40af', paddingBottom: '16px' }}>
          <h1 style={{ color: '#1e40af', margin: 0 }}>CUSTOMER ORDER</h1>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: '8px 0 0' }}>{order.orderNumber}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <p style={{ fontWeight: 700, color: '#1e40af' }}>Sold To:</p>
            <p style={{ fontWeight: 600 }}>{order.customerName || '—'}</p>
            {order.customerAddress && <p style={{ color: '#64748b' }}>{order.customerAddress}</p>}
            {order.customerPhone && <p style={{ color: '#64748b' }}>Ph: {order.customerPhone}</p>}
            {order.customerGstin && <p style={{ color: '#64748b' }}>GSTIN: {order.customerGstin}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p><span style={{ fontWeight: 700 }}>Date:</span> {order.orderDate}</p>
            {order.expectedDate && <p><span style={{ fontWeight: 700 }}>Delivery By:</span> {order.expectedDate}</p>}
            {order.reference && <p><span style={{ fontWeight: 700 }}>Ref:</span> {order.reference}</p>}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#1e40af', color: '#fff' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Rate</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Disc</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tax</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(order.lines || []).map((line, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 12px' }}>{i + 1}</td>
                <td style={{ padding: '8px 12px' }}>{line.itemName || '—'}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{line.quantity} {line.unit}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{line.rate?.toFixed(2)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{line.discount || 0}%</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{line.taxAmount?.toFixed(2)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>₹{line.total?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ width: '280px' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px' }}>Subtotal</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>₹{order.subtotal?.toFixed(2)}</td></tr>
              <tr><td style={{ padding: '4px 8px' }}>Tax</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>₹{order.taxAmount?.toFixed(2)}</td></tr>
              {order.roundOff !== 0 && <tr><td style={{ padding: '4px 8px' }}>Round Off</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>₹{order.roundOff?.toFixed(2)}</td></tr>}
              <tr style={{ fontWeight: 700, fontSize: '1.1rem', borderTop: '2px solid #1e40af' }}>
                <td style={{ padding: '8px' }}>Total</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>₹{order.totalAmount?.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {order.terms && (
          <div style={{ marginTop: '32px', padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <p style={{ fontWeight: 700, marginBottom: '8px' }}>Terms & Conditions</p>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#475569' }}>{order.terms}</p>
          </div>
        )}

        {order.notes && (
          <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#64748b' }}>
            <strong>Notes:</strong> {order.notes}
          </div>
        )}
      </div>
    </div>
  );
}
