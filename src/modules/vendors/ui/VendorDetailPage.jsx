import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function VendorDetailPage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadVendor(); }, [id]);

  async function loadVendor() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('vendor:getById', { id });
      if (result.success && result.data) { setVendor(result.data); }
      else { setError(result.error || 'Vendor not found'); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (loading) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Loading...</p></div>;
  if (error) return <div style={{ padding: 'var(--spacing-xl)' }}><p className="alert alert-error">{error}</p></div>;
  if (!vendor) return <div style={{ padding: 'var(--spacing-xl)' }}><p>Vendor not found</p></div>;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>{vendor.name}</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Link to={`/vendors/${vendor.id}/edit`} className="btn btn-primary">Edit</Link>
          <Link to="/vendors" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
      <div className="data-card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div><h4>Contact</h4> {vendor.email && <p>{vendor.email}</p>} {vendor.phone && <p>{vendor.phone}</p>} {vendor.gstin && <p>GSTIN: {vendor.gstin}</p>}</div>
          <div><h4>Details</h4> {vendor.pan && <p>PAN: {vendor.pan}</p>} {vendor.paymentTerms && <p>Terms: {vendor.paymentTerms}</p>}</div>
        </div>
      </div>
      {vendor.addressLine1 && <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}><h4>Address</h4><p>{[vendor.addressLine1, vendor.addressLine2, vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(', ')}, {vendor.country}</p></div>}
    </div>
  );
}