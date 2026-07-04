import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadQuotation(); }, [id]);

  async function loadQuotation() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('quotation:getById', { id });
      if (result.success && result.data) { setQuotation(result.data); }
      else { setError(result.error || 'Quotation not found'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleConvertToInvoice() {
    if (!quotation) return;
    setConverting(true);
    setError('');
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('invoice:create', {
        customerId: quotation.customerId,
        customerName: quotation.customerName,
        quotationId: quotation.id,
        lines: quotation.lines.map(l => ({
          itemId: l.itemId,
          itemName: l.itemName,
          quantity: l.quantity,
          rate: l.rate,
          discount: l.discount,
          gstRate: l.gstRate,
        })),
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        notes: `From quotation ${quotation.quotationNumber}`,
      });
      if (result.success && result.data?.id) {
        navigate(`/invoices/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create invoice');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setConverting(false);
    }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;
  if (error) return <div style={{ padding: 'var(--spacing-xl)' }}><p className="alert alert-error">{error}</p></div>;
  if (!quotation) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Quotation not found</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>{quotation.quotationNumber}</h1>
          <p>Status: <strong style={{ textTransform: 'capitalize' }}>{quotation.status}</strong></p>
          <p>Date: {quotation.date} {quotation.validityDate && `| Valid till: ${quotation.validityDate}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Link to={`/quotations/${quotation.id}/edit`} className="btn btn-primary">Edit</Link>
          <Link to="/quotations" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>

      <div className="data-card">
        <p><strong>Customer:</strong> {quotation.customerName}</p>
        {quotation.notes && <p><strong>Notes:</strong> {quotation.notes}</p>}
      </div>

      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <h4>Line Items</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Item</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Rate</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Discount</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>GST %</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Total</th>
          </tr></thead>
          <tbody>
            {quotation.lines?.map(line => (
              <tr key={line.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}>{line.itemName || line.itemId}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{line.quantity}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>₹{line.rate}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>₹{line.discount}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{line.gstRate}%</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>₹{line.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div></div>
          <div>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span> <strong>₹{quotation.subtotal}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax:</span> <strong>₹{quotation.taxAmount}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount:</span> <strong>-₹{quotation.discountAmount}</strong></p>
            <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1em' }}><span>Total:</span> <strong>₹{quotation.totalAmount}</strong></p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)' }}>
        <button className="btn btn-primary" disabled={converting || quotation?.status === 'final'} onClick={handleConvertToInvoice}>
          {converting ? 'Converting...' : 'Convert to Invoice'}
        </button>
      </div>
    </div>
  );
}