import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../shell/shared-state.js';

export default function CompanySelectPage() {
  const navigate = useNavigate();
  const currentUser = useStore(s => s.currentUser);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyGSTIN, setNewCompanyGSTIN] = useState('');
  const [newCompanyState, setNewCompanyState] = useState('');
  const [newCompanyCity, setNewCompanyCity] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadCompanies();
  }, [currentUser, navigate]);

  async function loadCompanies() {
    try {
      const commandBus = window.__shell?.commandBus;
      if (!commandBus) {
        throw new Error('Command bus not available');
      }
      
      const result = await commandBus.invoke('company:getList');
      if (result.success) {
        setCompanies(result.data);
      } else {
        setError(result.error || 'Failed to load companies');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(company) {
    try {
      const commandBus = window.__shell?.commandBus;
      if (!commandBus) {
        throw new Error('Command bus not available');
      }
      
      const result = await commandBus.invoke('company:setCurrent', { companyId: company.id });
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to set company:', err);
    }
  }

  async function handleAddCompany(e) {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setAdding(true);
    setError('');
    try {
      const commandBus = window.__shell?.commandBus;
      if (!commandBus) throw new Error('Command bus not available');

      const result = await commandBus.invoke('company:create', {
        name: newCompanyName.trim(),
        gstin: newCompanyGSTIN.trim() || undefined,
        state: newCompanyState.trim() || undefined,
        city: newCompanyCity.trim() || undefined,
        isActive: true,
      });

      if (result.success) {
        setNewCompanyName('');
        setNewCompanyGSTIN('');
        setNewCompanyState('');
        setNewCompanyCity('');
        setShowAddForm(false);
        await loadCompanies();
      } else {
        setError(result.error || 'Failed to add company');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Select Company</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
          Welcome, {currentUser.fullName}. Please select a company to continue.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p>Loading companies...</p>
        ) : (
          <>
            {companies.length > 0 && (
              <div className="data-list" style={{ marginBottom: 'var(--spacing-lg)' }}>
                {companies.map((company) => (
                  <div key={company.id} className="data-card" style={{ cursor: 'pointer' }} onClick={() => handleSelect(company)}>
                    <div className="data-card-header">
                      <h3>{company.name}</h3>
                    </div>
                    {company.gstin && <p>GSTIN: {company.gstin}</p>}
                    {company.address_line1 && <p>{company.address_line1}, {company.city}</p>}
                  </div>
                ))}
              </div>
            )}

            {companies.length === 0 && !showAddForm && (
              <div className="empty-state">
                <p>No companies found. Please add a company first.</p>
              </div>
            )}

            {showAddForm ? (
              <form onSubmit={handleAddCompany} style={{ marginTop: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label>Company Name *</label>
                  <input type="text" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} required autoFocus placeholder="e.g. My Business" />
                </div>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input type="text" value={newCompanyGSTIN} onChange={(e) => setNewCompanyGSTIN(e.target.value)} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" value={newCompanyState} onChange={(e) => setNewCompanyState(e.target.value)} placeholder="Maharashtra" />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input type="text" value={newCompanyCity} onChange={(e) => setNewCompanyCity(e.target.value)} placeholder="Mumbai" />
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                  <button type="submit" className="btn btn-primary" disabled={adding}>
                    {adding ? 'Adding...' : 'Add'}
                  </button>
                  <button type="button" className="btn" onClick={() => { setShowAddForm(false); setError(''); }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                Add Company
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: 'var(--color-bg)',
  },
  box: {
    width: '100%',
    maxWidth: '600px',
    padding: 'var(--spacing-xl)',
    backgroundColor: 'var(--color-surface)',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
};