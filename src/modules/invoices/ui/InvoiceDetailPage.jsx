import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadInvoice(); }, [id]);

  async function loadInvoice() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('invoice:getById', { id });
      if (result.success && result.data) { setInvoice(result.data); }
      else { setError(result.error || 'Invoice not found'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;
  if (error) return <div style={{ padding: 'var(--spacing-xl)' }}><p className="alert alert-error">{error}</p></div>;
  if (!invoice) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Invoice not found</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>{invoice.invoiceNumber}</h1>
          <p>Status: <strong style={{ textTransform: 'capitalize' }}>{invoice.status}</strong></p>
          <p>Date: {invoice.date} {invoice.dueDate && `| Due: ${invoice.dueDate}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {invoice.status !== 'cancelled' && invoice.status !== 'confirmed' && <Link to={`/invoices/${invoice.id}/edit`} className="btn btn-primary">Edit</Link>}
          <Link to="/invoices" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>

      <div className="data-card">
        <p><strong>Customer:</strong> {invoice.customerName}</p>
        {invoice.quotationId && <p><strong>Quotation ID:</strong> {invoice.quotationId}</p>}
        {invoice.notes && <p><strong>Notes:</strong> {invoice.notes}</p>}
        {invoice.terms && <p><strong>Terms:</strong> {invoice.terms}</p>}
      </div>

      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <h4>Line Items</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Item</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Rate</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>GST %</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Total</th>
          </tr></thead>
          <tbody>
            {invoice.lines?.map(line => (
              <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}>{line.itemName || line.itemId}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{line.quantity}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>₹{line.rate}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{line.gstRate}%</td>
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
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span> <strong>₹{invoice.subtotal}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax:</span> <strong>₹{invoice.taxAmount}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount:</span> <strong>-₹{invoice.discountAmount}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em' }}><span>Total:</span> <strong>₹{invoice.totalAmount}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}