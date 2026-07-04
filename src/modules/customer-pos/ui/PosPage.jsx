import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function PosPage() {
  const { customerId } = useParams();
  const [cart, setCart] = useState({ lines: [], customerId: customerId || '', customerName: '' });
  const [items, setItems] = useState([]);
  const [searchItem, setSearchItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadItems();
    const handler = (data) => setCart(data.cart);
    window.__shell?.eventBus?.on('pos:cartUpdated', handler);
    return () => window.__shell?.eventBus?.off('pos:cartUpdated', handler);
  }, []);

  async function loadItems() {
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('item:getList', { limit: 200 });
      if (result.success) setItems(result.data);
    } catch (err) { setError(err.message); }
  }

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchItem.toLowerCase()) || (i.sku || '').toLowerCase().includes(searchItem.toLowerCase()));

  async function addItem(item) {
    try {
      const commandBus = window.__shell?.commandBus;
      await commandBus.invoke('pos:addLine', { itemId: item.id, quantity: 1, rate: item.sellingPrice, gstRate: item.taxRate });
    } catch (err) { setError(err.message); }
  }

  async function updateLine(lineId, field, value) {
    try {
      const commandBus = window.__shell?.commandBus;
      await commandBus.invoke('pos:updateLine', { lineId, updates: { [field]: value } });
    } catch (err) { setError(err.message); }
  }

  async function removeLine(lineId) {
    try {
      const commandBus = window.__shell?.commandBus;
      await commandBus.invoke('pos:removeLine', { lineId });
    } catch (err) { setError(err.message); }
  }

  async function resetCart() {
    if (!window.confirm('Clear cart?')) return;
    try {
      const commandBus = window.__shell?.commandBus;
      await commandBus.invoke('pos:resetCart');
    } catch (err) { setError(err.message); }
  }

  async function createInvoice() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('pos:createInvoiceFromCart');
      if (result.success) navigate(`/invoices/${result.data.id}`);
      else setError(result.error);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const subtotal = cart.lines.reduce((s, l) => s + l.subtotal, 0);
  const taxAmount = cart.lines.reduce((s, l) => s + (l.subtotal * l.gstRate / 100), 0);
  const discountAmount = cart.lines.reduce((s, l) => s + l.discount, 0);
  const total = subtotal + taxAmount - discountAmount;

  return (
    <div style={{ display: 'flex', height: '100vh', padding: 'var(--spacing-xl)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h1>POS Billing</h1>
          <Link to="/invoices" className="btn btn-secondary">Back to Invoices</Link>
        </div>

        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <input type="text" placeholder="Search items..." value={searchItem} onChange={(e) => setSearchItem(e.target.value)} className="form-input" style={{ maxWidth: '300px' }} />
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
            {filteredItems.map(item => (
              <div key={item.id} className="data-card" style={{ cursor: 'pointer' }} onClick={() => addItem(item)}>
                <h4>{item.name}</h4>
                <p>SKU: {item.sku}</p>
                <p>₹{item.sellingPrice}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ width: '400px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--spacing-lg)' }}>
        <h3>Cart</h3>
        <p>Customer: {cart.customerName || customerId || 'Walk-in'}</p>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {cart.lines.length === 0 ? <p>Cart empty</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {cart.lines.map(line => (
                  <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--spacing-sm)' }}>
                      <div style={{ fontWeight: 500 }}>{line.itemName || line.itemId}</div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>Qty: <input type="number" value={line.quantity} onChange={(e) => updateLine(line.id, 'quantity', Number(e.target.value))} min="1" style={{ width: '50px' }} /></div>
                    </td>
                    <td style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>₹{line.total?.toFixed(2) || '0.00'}</td>
                    <td style={{ padding: 'var(--spacing-sm)', textAlign: 'center' }}><button onClick={() => removeLine(line.id)} className="btn btn-danger btn-sm">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span> <strong>₹{subtotal.toFixed(2)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax:</span> <strong>₹{taxAmount.toFixed(2)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount:</span> <strong>-₹{discountAmount.toFixed(2)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em' }}><strong>Total:</strong> <strong>₹{total.toFixed(2)}</strong></div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
          <button onClick={resetCart} className="btn btn-secondary" style={{ flex: 1 }}>Reset</button>
          <button onClick={createInvoice} disabled={loading || cart.lines.length === 0} className="btn btn-primary" style={{ flex: 2 }}>
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}