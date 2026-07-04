import React, { useState, useEffect } from 'react';
import { useStore } from '../../../shell/shared-state.js';

export function SettingsPage() {
  const theme = useStore(s => s.theme);
  const setTheme = useStore(s => s.setTheme);
  const currentUser = useStore(s => s.currentUser);
  const isLicensed = useStore(s => s.isLicensed);
  const licenseInfo = useStore(s => s.licenseInfo);

  const [licenseKey, setLicenseKey] = useState('');
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [licenseError, setLicenseError] = useState('');
  const [activating, setActivating] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    loadLicenseStatus();
  }, []);

  async function loadLicenseStatus() {
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('license:getStatus');
      if (result.success) setLicenseStatus(result.data);
    } catch (err) { setLicenseError(err.message); }
  }

  async function handleActivate(e) {
    e.preventDefault();
    if (!licenseKey.trim()) return;
    setActivating(true);
    setLicenseError('');
    try {
      const commandBus = window.__shell?.commandBus;
      const result = await commandBus.invoke('license:activate', { key: licenseKey.trim() });
      if (result.success) {
        setLicenseKey('');
        await loadLicenseStatus();
      } else {
        setLicenseError(result.error || 'Activation failed');
      }
    } catch (err) { setLicenseError(err.message); }
    finally { setActivating(false); }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword.length < 6) { setPasswordMsg('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg('Passwords do not match'); return; }
    setPasswordSaving(true);
    try {
      const bus = window.__shell?.commandBus;
      const result = await bus.invoke('auth:changePassword', {
        username: currentUser?.username,
        currentPassword,
        newPassword,
      });
      if (result.success) {
        setPasswordMsg('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg(result.error || 'Failed to change password');
      }
    } catch (err) { setPasswordMsg(err.message); }
    finally { setPasswordSaving(false); }
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <h2>Settings</h2>

      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <div className="data-card-header"><h3>License</h3></div>
        <div className="data-card-body">
          {licenseStatus && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <p><strong>Status:</strong> {licenseStatus.type === 'licensed' ? 'Licensed' : 'Trial'}</p>
              {licenseStatus.type === 'trial' && <p><strong>Days Remaining:</strong> {licenseStatus.daysLeft}</p>}
              {licenseStatus.type === 'licensed' && licenseInfo?.licenseKey && <p><strong>Key:</strong> {licenseInfo.licenseKey.substring(0, 10)}...</p>}
            </div>
          )}
          {licenseError && <div className="alert alert-error">{licenseError}</div>}
          <form onSubmit={handleActivate} style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>License Key</label>
              <input type="text" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} placeholder="Enter license key" minLength={10} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={activating || !licenseKey.trim()}>
              {activating ? 'Activating...' : 'Activate'}
            </button>
          </form>
        </div>
      </div>

      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <div className="data-card-header"><h3>Appearance</h3></div>
        <div className="data-card-body">
          <div className="form-group">
            <label>Theme</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <div className="data-card-header"><h3>Change Password</h3></div>
        <div className="data-card-body">
          {passwordMsg && <div className={passwordMsg.includes('success') ? 'alert alert-success' : 'alert alert-error'}>{passwordMsg}</div>}
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
              {passwordSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      <div className="data-card" style={{ marginTop: 'var(--spacing-md)' }}>
        <div className="data-card-header"><h3>Keyboard Shortcuts</h3></div>
        <div className="data-card-body">
          <table style={{ width: '100%' }}>
            <tbody>
              <tr><td><strong>Ctrl + S</strong></td><td>Save current form</td></tr>
              <tr><td><strong>Ctrl + N</strong></td><td>New / Clear form</td></tr>
              <tr><td><strong>Ctrl + P</strong></td><td>Print preview</td></tr>
              <tr><td><strong>Ctrl + D</strong></td><td>Toggle dark mode</td></tr>
              <tr><td><strong>Escape</strong></td><td>Close modal / Cancel edit</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
