import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function ItemFormPage() {
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '', sku: '', hsnCode: '', unit: 'PCS',
    purchasePrice: 0, sellingPrice: 0, taxRate: 0,
    openingStock: 0, lowStockAlert: 0, isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { if (isEdit) loadItem(); }, [id]);

  async function loadItem() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('item:getById', { id });
      if (result.success && result.data) {
        const d = result.data;
        setFormData({
          name: d.name || '', sku: d.sku || '', hsnCode: d.hsnCode || '',
          unit: d.unit || 'PCS', purchasePrice: d.purchasePrice || 0,
          sellingPrice: d.sellingPrice || 0, taxRate: d.taxRate || 0,
          openingStock: d.openingStock || 0, lowStockAlert: d.lowStockAlert || 0,
          isActive: d.isActive ?? true,
        });
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const commandBus = window.__shell?.commandBus;
      const result = isEdit
        ? await commandBus.invoke('item:update', { id, data: formData })
        : await commandBus.invoke('item:create', formData);
      if (result.success) navigate('/items');
      else setError(result.error || 'Save failed');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (loading && isEdit) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>{isEdit ? 'Edit Item' : 'New Item'}</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Item Name *</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="sku">SKU</label>
            <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="hsnCode">HSN Code</label>
            <input type="text" id="hsnCode" name="hsnCode" value={formData.hsnCode} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="unit">Unit</label>
            <select id="unit" name="unit" value={formData.unit} onChange={handleChange}>
              <option value="PCS">PCS</option>
              <option value="KG">KG</option>
              <option value="LTR">LTR</option>
              <option value="MTR">MTR</option>
              <option value="BOX">BOX</option>
              <option value="DOZ">DOZ</option>
            </select>
          </div>
        </div>

        <h4 style={{ marginTop: 'var(--spacing-lg)' }}>Pricing</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="purchasePrice">Purchase Price (₹)</label>
            <input type="number" id="purchasePrice" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label htmlFor="sellingPrice">Selling Price (₹)</label>
            <input type="number" id="sellingPrice" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label htmlFor="taxRate">Tax Rate (%)</label>
            <input type="number" id="taxRate" name="taxRate" value={formData.taxRate} onChange={handleChange} min="0" max="100" step="0.5" />
          </div>
        </div>

        <h4 style={{ marginTop: 'var(--spacing-lg)' }}>Inventory</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="openingStock">Opening Stock</label>
            <input type="number" id="openingStock" name="openingStock" value={formData.openingStock} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label htmlFor="lowStockAlert">Low Stock Alert</label>
            <input type="number" id="lowStockAlert" name="lowStockAlert" value={formData.lowStockAlert} onChange={handleChange} min="0" />
          </div>
        </div>

        <div className="form-group">
          <label>
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /> Active Item
          </label>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          <Link to="/items" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}