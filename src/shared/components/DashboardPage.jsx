import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../shell/shared-state.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const currentUser = useStore(s => s.currentUser);
  const currentCompany = useStore(s => s.currentCompany);
  const clearAuth = useStore(s => s.clearAuth);

  if (!currentUser || !currentCompany) {
    return <div style={{ padding: 'var(--spacing-xl)' }}>Redirecting...</div>;
  }

  function handleLogout() {
    clearAuth();
    localStorage.removeItem('auth_token');
    navigate('/login');
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <h3>Welcome, {currentUser.fullName}</h3>
        </div>
        <div className="data-card-body">
          <p><strong>Company:</strong> {currentCompany.name}</p>
          {currentCompany.gstin && (
            <p><strong>GSTIN:</strong> {currentCompany.gstin}</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>New Invoice</button>
          <button className="btn" onClick={() => navigate('/quotations/new')}>New Quotation</button>
          <button className="btn" onClick={() => navigate('/purchases/new')}>New Purchase</button>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
