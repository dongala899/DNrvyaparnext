import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function PaymentDetailPage() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadPayment(); }, [id]);

  async function loadPayment() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('payment:getById', { id });
      if (result.success && result.data) { setPayment(result.data); }
      else { setError(result.error || 'Payment not found'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;
  if (error) return <div style={{ padding: 'var(--spacing-xl)' }}><p className="alert alert-error">{error}</p></div>;
  if (!payment) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Payment not found</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>₹{payment.amount}</h1>
          <p>Status: <strong style={{ textTransform: 'capitalize' }}>{payment.status}</strong></p>
          <p>Payment Mode: <strong>{payment.paymentMode?.toUpperCase()}</strong></p>
          <p>Date: {payment.paymentDate}</p>
          {payment.referenceNumber && <p>Reference: {payment.referenceNumber}</p>}
        </div>
        <Link to="/payments" className="btn btn-secondary">Back to List</Link>
      </div>
      {payment.notes && <div className="data-card"><p>{payment.notes}</p></div>}
    </div>
  );
}