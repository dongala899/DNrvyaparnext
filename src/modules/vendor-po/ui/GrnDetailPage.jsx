import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function GrnDetailPage() {
  const { id } = useParams();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadGrn(); }, [id]);

  async function loadGrn() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('grn:getById', { id });
      if (result.success) setGrn(result.data);
      else setError(result.error || 'GRN not found');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;
  if (error) return <div style={{ padding: 'var(--spacing-xl)' }}><p className="alert alert-error">{error}</p></div>;
  if (!grn) return <div style={{ padding: 'var(--spacing-xl)' }}><p>GRN not found</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div><h1>{grn.grnNumber}</h1><p>PO ID: {grn.poId} • {grn.date}</p></div>
        <Link to="/grn" className="btn btn-secondary">Back to GRNs</Link>
      </div>
      {grn.notes && <div className="data-card"><p>{grn.notes}</p></div>}
    </div>
  );
}