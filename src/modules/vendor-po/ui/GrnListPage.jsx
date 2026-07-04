import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function GrnListPage() {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadGrns(); }, []);

  async function loadGrns() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('grn:getList', { limit: 200 });
      if (result.success) setGrns(result.data);
      else setError(result.error || 'Failed to load GRNs');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Goods Received Notes</h1>
        <Link to="/grn/new" className="btn btn-primary">New GRN</Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <p>Loading GRNs...</p> : grns.length === 0 ? <p>No GRNs found. <Link to="/grn/new">Create your first GRN</Link></p> : (
        <div className="data-list">
          {grns.map(grn => (
            <div key={grn.id} className="data-card" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3>{grn.grnNumber}</h3>
                  <p>PO ID: {grn.poId} • {grn.date}</p>
                </div>
                <div><Link to={`/grn/${grn.id}`} className="btn btn-secondary btn-sm">View</Link></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}