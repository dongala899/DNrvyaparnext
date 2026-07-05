import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function GrnFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const [po, setPo] = useState(null);
  const [formData, setFormData] = useState({ poId: id && id !== 'new' ? id : '', lines: [], notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => { if (formData.poId) loadPo(); }, [formData.poId]);

  async function loadPo() {
    const commandBus = window.__shell?.commandBus;
    const result = await commandBus.invoke('po:getById', { id: formData.poId });
    if (result.success) {
      setPo(result.data);
      setFormData(prev => ({ ...prev, lines: result.data.lines.map(l => ({ poLineId: l.id, itemId: l.itemId, quantity: l.quantity - (l.receivedQuantity || 0), rate: l.rate })) }));
    }
  }

  const handleLineChange = (idx, field, value) => {
    const lines = [...formData.lines];
    lines[idx] = { ...lines[idx], [field]: value };
    setFormData(prev => ({ ...prev, lines }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    const errors = {};
    if (!formData.poId) errors.poId = 'PO ID is required';
    if (!formData.lines || formData.lines.length === 0) errors.lines = 'At least one line is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('po:createGrn', { poId: formData.poId, data: { lines: formData.lines, notes: formData.notes } });
      if (result.success) navigate('/grn');
      else setError(result.error || 'Save failed');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>New GRN</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="poId">PO ID *</label>
          <input type="text" id="poId" name="poId" value={formData.poId} onChange={(e) => setFormData(prev => ({ ...prev, poId: e.target.value }))} required disabled={!isNew} />
          {fieldErrors.poId && <div className="alert alert-error" style={{marginTop:'4px',padding:'6px 8px',fontSize:'0.85em'}}>{fieldErrors.poId}</div>}
        </div>

        {po && (
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <p><strong>Vendor:</strong> {po.vendorName}</p>
            <p><strong>Total Amount:</strong> ₹{po.totalAmount}</p>
          </div>
        )}

        <h4>Receive Items</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--spacing-md)' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Item</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Ordered</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>To Receive</th>
            <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Rate</th>
          </tr></thead>
          <tbody>
            {formData.lines.map((line, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}>{line.itemId}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{po?.lines?.[idx]?.quantity || 0}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}><input type="number" value={line.quantity} onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))} min="0" style={{ textAlign: 'right', width: '80px' }} /></td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>₹{line.rate}</td>
              </tr>
            ))}
                    </tbody>
        </table>
        {fieldErrors.lines && <div className="alert alert-error" style={{marginTop:'4px',padding:'6px 8px',fontSize:'0.85em'}}>{fieldErrors.lines}</div>}

        <div className="form-group"><label htmlFor="notes">Notes</label>
<textarea id="notes" name="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows="2" /></div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create GRN'}</button>
          <Link to="/grn" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}