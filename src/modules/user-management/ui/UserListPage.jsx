import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('user:getList');
      if (result.success) setUsers(result.data);
      else setError(result.error || 'Failed to load users');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleToggleActive(user) {
    try {
      const commandBus = window.__shell?.commandBus;
      const currentUser = window.__shell?.sharedState?.getState?.()?.currentUser;
      if (user.isActive) {
        await commandBus.invoke('user:deactivate', { id: user.id }, currentUser);
      } else {
        await commandBus.invoke('user:activate', { id: user.id });
      }
      await loadUsers();
    } catch (err) { setError(err.message); }
  }

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Users</h1>
        <Link to="/users/new" className="btn btn-primary">Add User</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." />
      </div>

      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Username</th>
              <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Full Name</th>
              <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Role</th>
              <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Status</th>
              <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}>{user.username}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}>{user.full_name}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}>{user.role_id}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}>{user.is_active ? 'Active' : 'Inactive'}</td>
                <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>
                  <button className="btn btn-sm" onClick={() => handleToggleActive(user)}>
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
