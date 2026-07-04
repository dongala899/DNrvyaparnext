import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function CustomerOrderListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadOrders(); }, [statusFilter]);

  async function loadOrders() {
    setLoading(true);
    try {
      const bus = window.__shell?.commandBus;
      const result = await bus.invoke('customerOrder:getList', { status: statusFilter, search, limit: 100 });
      if (result.success) setOrders(result.data);
      else setError(result.error || 'Failed to load orders');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this customer order?')) return;
    try {
      const bus = window.__shell?.commandBus;
      const result = await bus.invoke('customerOrder:delete', { id });
      if (result.success) loadOrders();
      else setError(result.error || 'Delete failed');
    } catch (err) { setError(err.message); }
  }

  async function handleConvert(id) {
    if (!window.confirm('Convert this order to an invoice?')) return;
    try {
      const bus = window.__shell?.commandBus;
      const result = await bus.invoke('customerOrder:convertToInvoice', { id });
      if (result.success && result.data?.id) {
        navigate(`/invoices/${result.data.id}`);
      } else {
        setError(result.error || 'Conversion failed');
      }
    } catch (err) { setError(err.message); }
  }

  const filtered = orders.filter(o => {
    if (search && !o.orderNumber?.toLowerCase().includes(search.toLowerCase()) &&
        !o.customerName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusBadge = (status) => {
    const colors = { draft: '#f59e0b', confirmed: '#10b981', cancelled: '#ef4444', converted: '#6366f1' };
    return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: colors[status] || '#6b7280', color: '#fff' }}>{status}</span>;
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Customer Orders</h1>
        <Link to="/customer-orders/new" className="btn btn-primary">New Order</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <input type="text" placeholder="Search by order number or customer..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadOrders()} style={{ maxWidth: '320px' }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '140px' }}>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="converted">Converted</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? <p>Loading...</p> : filtered.length === 0 ? (
        <p>No customer orders found. <Link to="/customer-orders/new">Create your first order</Link></p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Order #</th>
              <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Date</th>
              <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Customer</th>
              <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Items</th>
              <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Total</th>
              <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>Status</th>
              <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}><Link to={`/customer-orders/${order.id}`}>{order.orderNumber}</Link></td>
                <td style={{ padding: 'var(--spacing-sm)' }}>{order.orderDate}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}>{order.customerName || '—'}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{order.lines?.length || 0}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', fontWeight: 600 }}>₹{order.totalAmount?.toFixed(2)}</td>
                <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>{statusBadge(order.status)}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>
                  {order.status !== 'converted' && order.status !== 'cancelled' && (
                    <>
                      <Link to={`/customer-orders/${order.id}/edit`} className="btn btn-sm" style={{ marginRight: '4px' }}>Edit</Link>
                      <button onClick={() => handleConvert(order.id)} className="btn btn-sm" style={{ marginRight: '4px', background: '#10b981', color: '#fff' }}>Convert</button>
                    </>
                  )}
                  <Link to={`/customer-orders/${order.id}/preview`} className="btn btn-sm" style={{ marginRight: '4px' }}>View</Link>
                  {order.status !== 'converted' && (
                    <button onClick={() => handleDelete(order.id)} className="btn btn-sm" style={{ background: '#ef4444', color: '#fff' }}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
