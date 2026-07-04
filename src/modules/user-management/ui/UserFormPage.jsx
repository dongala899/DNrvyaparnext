import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


export function UserFormPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('user');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const commandBus = window.__shell?.commandBus;
      const currentUser = window.__shell?.sharedState?.getState?.()?.currentUser;
      const result = await commandBus.invoke('user:create', {
        username, fullName, password, roleId, email: email || undefined, phone: phone || undefined, isActive: true,
      }, currentUser);
      if (result.success) { navigate('/users'); }
      else { setError(result.error || 'Failed to create user'); }
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: '600px' }}>
      <h1>Add User</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username *</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </div>
        <div className="form-group">
          <label>Full Name *</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password *</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Create User'}
          </button>
          <button type="button" className="btn" onClick={() => navigate('/users')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
