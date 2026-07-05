import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function PosPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ lines: [], customerId: customerId || '', customerName: '' });
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchItem, setSearchItem] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    loadItems();
    loadCustomers();
    const handler = (data) => setCart(data.cart);
    window.__shell?.eventBus?.on('pos:cartUpdated', handler);
    return () => window.__shell?.eventBus?.off('pos:cartUpdated', handler);
  }, []);

  useEffect(() => {
    const term = searchItem.trim().toLowerCase();
    if (!term) { setFilteredItems(items); return; }
    setFilteredItems(items.filter(i => i.name.toLowerCase().includes(term) || (i.sku || '').toLowerCase().includes(term) || (i.hsnCode || '').toLowerCase().includes(term)));
  }, [searchItem, items]);

  async function loadItems() {
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('item:getList', { limit: 500 });
      if (result.success) { setItems(result.data); setFilteredItems(result.data); }
    } catch (err) { setError(err.message); }
  }

  async function loadCustomers() {
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('customer:getList', { limit: 200 });
      if (result.success) setCustomers(result.data);
    } catch (err) {}
  }

  async function addItem(item) {
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('pos:addLine', {
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        rate: item.sellingPrice,
        gstRate: item.taxRate,
      });
      if (!result.success) {
        setError(result.error || 'Failed to add item');
      }
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

  async function selectCustomer(c) {
    setCart(prev => ({ ...prev, customerId: c.id, customerName: c.name }));
    setCustomerSearch(c.name);
    setShowCustomerDropdown(false);
  }

  async function handleCheckout() {
    if (cart.lines.length === 0) return;
    setCheckingOut(true);
    setError('');
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('pos:createInvoiceFromCart');
      if (result.success) {
        if (paymentMode !== 'none' && receivedAmount) {
          await commandBus.invoke('payment:create', {
            invoiceId: result.data.id,
            customerId: cart.customerId,
            amount: Number(receivedAmount),
            paymentMode,
            paymentDate: new Date().toISOString().split('T')[0],
            status: 'completed',
          });
        }
        navigate(`/invoices/${result.data.id}`);
      } else {
        setError(result.error);
      }
    } catch (err) { setError(err.message); }
    finally { setCheckingOut(false); }
  }

  const subtotal = cart.lines.reduce((s, l) => s + (l.subtotal || 0), 0);
  const taxAmount = cart.lines.reduce((s, l) => s + ((l.subtotal || 0) * (l.gstRate || 0) / 100), 0);
  const discountAmount = cart.lines.reduce((s, l) => s + (l.discount || 0), 0);
  const total = subtotal + taxAmount - discountAmount;
  const changeDue = paymentMode !== 'none' && receivedAmount ? Number(receivedAmount) - total : 0;

  const matchedCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone || '').includes(customerSearch)).slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h1 style={{ margin: 0 }}>POS Billing</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <Link to="/invoices" className="btn btn-secondary">Back to Invoices</Link>
          <button onClick={resetCart} className="btn btn-secondary">Reset Cart</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--spacing-md)', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Search items by name, SKU, HSN..." value={searchItem} onChange={(e) => setSearchItem(e.target.value)} className="form-input" style={{ flex: 1, minWidth: '220px' }} />
          </div>

          <div style={{ overflow: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--spacing-md)' }}>
              {filteredItems.map(item => (
                <div key={item.id} className="data-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => addItem(item)}>
                  <div>
                    <h4 style={{ margin: '0 0 var(--spacing-xs)' }}>{item.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--color-text-secondary)' }}>SKU: {item.sku || '-'}</p>
                    <p style={{ margin: 'var(--spacing-xs) 0 0', fontWeight: 600 }}>₹{(item.sellingPrice || 0).toFixed(2)}</p>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ marginTop: 'var(--spacing-sm)', width: '100%' }}>Add</button>
                </div>
              ))}
              {filteredItems.length === 0 && <p style={{ gridColumn: '1 / -1' }}>No items found</p>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-border)', paddingLeft: 'var(--spacing-md)', minHeight: 0 }}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ fontWeight: 600 }}>Customer</label>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Search customer..." value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }} onFocus={() => setShowCustomerDropdown(true)} className="form-input" />
              {showCustomerDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', marginTop: '4px', maxHeight: '220px', overflow: 'auto', zIndex: 10 }}>
                  {matchedCustomers.length === 0 && <p style={{ padding: 'var(--spacing-sm)', margin: 0 }}>No customers found</p>}
                  {matchedCustomers.map(c => (
                    <div key={c.id} style={{ padding: 'var(--spacing-sm)', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }} onMouseDown={() => selectCustomer(c)}>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: '0.85em', color: 'var(--color-text-secondary)' }}>{c.phone || ''} {c.gstin ? `| GSTIN: ${c.gstin}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.customerName && <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: '0.9em' }}>Selected: <strong>{cart.customerName}</strong></p>}
          </div>

          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {cart.lines.length === 0 ? <p>Cart is empty</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Item</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Total</th>
                  <th style={{ padding: 'var(--spacing-sm)' }}></th>
                </tr></thead>
                <tbody>
                  {cart.lines.map(line => (
                    <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--spacing-sm)' }}>
                        <div style={{ fontWeight: 500 }}>{line.itemName || line.itemId}</div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>₹{(line.rate || 0).toFixed(2)} x {line.gstRate}%</div>
                      </td>
                      <td style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>
                        <input type="number" value={line.quantity} onChange={(e) => updateLine(line.id, 'quantity', Number(e.target.value))} min="1" style={{ width: '64px', textAlign: 'right' }} />
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ fontSize: '0.9em' }}>Payment Mode</label>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="form-input" style={{ width: '100%' }}>
                  <option value="none">No Payment</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.9em' }}>Received Amount</label>
                <input type="number" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} min="0" step="0.01" className="form-input" style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span> <strong>₹{subtotal.toFixed(2)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax:</span> <strong>₹{taxAmount.toFixed(2)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount:</span> <strong>-₹{discountAmount.toFixed(2)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em' }}><span>Total:</span> <strong>₹{total.toFixed(2)}</strong></div>
              {paymentMode !== 'none' && receivedAmount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: changeDue >= 0 ? 'green' : 'red' }}>
                  <span>Change Due:</span> <strong>₹{changeDue.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <button onClick={handleCheckout} disabled={checkingOut || cart.lines.length === 0} className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-md)' }}>
              {checkingOut ? 'Processing...' : total > 0 ? `Checkout ₹${total.toFixed(2)}` : 'Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
