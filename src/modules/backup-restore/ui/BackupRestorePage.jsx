import React, { useState } from 'react';
import { useBackupStore } from '../state/store.js';

function getCommandBus() {
  const bus = window.__shell?.commandBus;
  if (!bus) throw new Error('Command bus not available');
  return bus;
}

function normalizeHeader(h) {
  return String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function mapHeaders(headerRow) {
  const map = {};
  const known = {
    name: 'name', customername: 'name', vendorname: 'name', itemname: 'name', servicename: 'name',
    email: 'email', emailaddress: 'email', e_mail: 'email',
    phone: 'phone', phoneno: 'phone', phonenumber: 'phone', mobile: 'phone', contact: 'phone',
    address: 'address', addr: 'address',
    gstin: 'gstin', gst: 'gstin', gstnumber: 'gstin', gstno: 'gstin',
    state: 'state', statename: 'state',
    type: 'type', itemtype: 'type',
    hsn: 'hsnSac', sac: 'hsnSac', hsnsac: 'hsnSac', hsnorsac: 'hsnSac',
    description: 'description', desc: 'description',
    rate: 'defaultRate', price: 'defaultRate', unitprice: 'defaultRate', amount: 'defaultRate',
    tax: 'taxRate', taxrate: 'taxRate', gstrate: 'taxRate',
  };
  for (let i = 0; i < headerRow.length; i++) {
    const n = normalizeHeader(headerRow[i]);
    if (known[n]) map[i] = known[n];
  }
  return map;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvText(text) {
  const clean = text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return clean.split('\n').filter(l => l.trim()).map(parseCsvLine);
}

function validateRow(row, headerMap, type) {
  const obj = {};
  const errors = [];
  const warnings = [];
  for (let i = 0; i < row.length; i++) {
    if (headerMap[i]) obj[headerMap[i]] = row[i];
  }
  if (!obj.name?.trim()) errors.push('Name is required');
  else obj.name = obj.name.trim();
  if (obj.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email)) warnings.push('Invalid email');
  if (obj.gstin) obj.gstin = obj.gstin.trim().toUpperCase();
  if (type === 'items') {
    const rate = parseFloat(obj.defaultRate);
    if (isNaN(rate) || rate < 0) { errors.push('Invalid rate'); obj.defaultRate = 0; }
    else obj.defaultRate = rate;
    const tax = parseFloat(obj.taxRate);
    obj.taxRate = isNaN(tax) ? 18 : tax;
  }
  return { obj, valid: errors.length === 0, errors, warnings };
}

export function BackupRestorePage() {
  const [sourcePath, setSourcePath] = useState('');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importType, setImportType] = useState('');

  const handleCreateBackup = async () => {
    setProgress({ percent: 50, status: 'Creating backup...' });
    setError('');
    try {
      const bus = getCommandBus();
      const result = await bus.invoke('backup:create', { type: 'sqlite' });
      if (result.success) setProgress({ percent: 100, status: 'Backup created successfully' });
      else setError(result.error || 'Backup failed');
    } catch (err) { setError(err.message); }
    finally { setTimeout(() => setProgress(null), 3000); }
  };

  const handleExportJson = async () => {
    setProgress({ percent: 50, status: 'Exporting...' });
    setError('');
    try {
      const bus = getCommandBus();
      const result = await bus.invoke('backup:exportJson');
      if (result.success) setProgress({ percent: 100, status: `Exported to ${result.data?.filePath || 'file'}` });
      else setError(result.error || 'Export failed');
    } catch (err) { setError(err.message); }
    finally { setTimeout(() => setProgress(null), 3000); }
  };

  const handleBrowseRestore = async () => {
    setError('');
    try {
      const result = await window.api.dialog.openFile({ filters: [{ name: 'Backup Files', extensions: ['json', 'db', 'sqlite'] }] });
      if (result.success && result.data?.length > 0) {
        const filePath = result.data[0];
        const filename = filePath.split(/[\\/]/).pop();
        setProgress({ percent: 50, status: `Restoring ${filename}...` });
        const bus = getCommandBus();
        const restoreResult = await bus.invoke('backup:restore', { filename, type: 'sqlite' });
        if (restoreResult.success) {
          setProgress({ percent: 100, status: 'Restore complete. Reloading...' });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setError(restoreResult.error || 'Restore failed');
        }
      }
    } catch (err) { setError(err.message); }
    finally { setTimeout(() => setProgress(null), 3000); }
  };

  const handleBrowseImportJson = async () => {
    setError('');
    try {
      const result = await window.api.dialog.openFile({ filters: [{ name: 'JSON Files', extensions: ['json'] }] });
      if (result.success && result.data?.length > 0) {
        const filePath = result.data[0];
        setProgress({ percent: 50, status: 'Importing...' });
        const bus = getCommandBus();
        const importResult = await bus.invoke('backup:importJson', { filePath });
        if (importResult.success) setProgress({ percent: 100, status: `Import complete. ${importResult.data?.imported || 0} records imported.` });
        else setError(importResult.error || 'Import failed');
      }
    } catch (err) { setError(err.message); }
    finally { setTimeout(() => setProgress(null), 3000); }
  };

  const handleExportCsv = async (entityType) => {
    setProgress({ percent: 50, status: `Exporting ${entityType}...` });
    setError('');
    try {
      const bus = getCommandBus();
      const result = await bus.invoke('data:exportCsv', { entityType });
      if (result.success) setProgress({ percent: 100, status: `Exported ${entityType} to ${result.data?.filePath || 'file'}` });
      else setError(result.error || 'Export failed');
    } catch (err) { setError(err.message); }
    finally { setTimeout(() => setProgress(null), 3000); }
  };

  const handleImportCsv = async (entityType) => {
    setError('');
    try {
      const result = await window.api.dialog.openFile({ filters: [{ name: 'CSV Files', extensions: ['csv'] }] });
      if (result.success && result.data?.length > 0) {
        const filePath = result.data[0];
        const readResult = await window.api.storage.readFile({ filePath });
        if (readResult.success) {
          const rows = parseCsvText(readResult.data);
          if (rows.length < 2) { setError('File must have a header row and at least one data row'); return; }
          const headerMap = mapHeaders(rows[0]);
          const hasName = Object.values(headerMap).includes('name');
          if (!hasName) { setError('Could not find a "Name" column in the CSV'); return; }
          const results = [];
          for (let i = 1; i < rows.length; i++) {
            results.push(validateRow(rows[i], headerMap, entityType));
          }
          setImportPreview({ results, entityType, headerMap, rows });
          setImportType(entityType);
        } else {
          setError('Failed to read file: ' + readResult.error);
        }
      }
    } catch (err) { setError(err.message); }
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    setProgress({ percent: 50, status: `Importing ${importType}...` });
    setError('');
    try {
      const bus = getCommandBus();
      const validItems = importPreview.results.filter(r => r.valid).map(r => r.obj);
      let imported = 0;
      for (const item of validItems) {
        const cmd = importType === 'customers' ? 'customer:create' : importType === 'vendors' ? 'vendor:create' : 'item:create';
        const result = await bus.invoke(cmd, item);
        if (result.success) imported++;
      }
      setProgress({ percent: 100, status: `Imported ${imported} ${importType}` });
      setImportPreview(null);
    } catch (err) { setError(err.message); }
    finally { setTimeout(() => setProgress(null), 3000); }
  };

  const validCount = importPreview?.results.filter(r => r.valid).length || 0;
  const errorCount = importPreview?.results.filter(r => !r.valid).length || 0;

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Backup & Restore</h1>

      {progress && <div style={{ padding: 'var(--spacing-md)', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: 'var(--spacing-md)', color: '#1e40af' }}>{progress.status}</div>}
      {error && <div style={{ padding: 'var(--spacing-md)', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: 'var(--spacing-md)', color: '#dc2626' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ padding: 'var(--spacing-lg)', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: 'var(--spacing-sm)', color: '#1e40af' }}>SQLite Backup</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 'var(--spacing-md)' }}>Create a full database backup</p>
          <button onClick={handleCreateBackup} style={{ width: '100%', padding: '10px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Create Backup</button>
        </div>

        <div style={{ padding: 'var(--spacing-lg)', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: 'var(--spacing-sm)', color: '#1e40af' }}>Restore</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 'var(--spacing-md)' }}>Restore from a backup file</p>
          <button onClick={handleBrowseRestore} style={{ width: '100%', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Browse & Restore</button>
        </div>

        <div style={{ padding: 'var(--spacing-lg)', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: 'var(--spacing-sm)', color: '#1e40af' }}>JSON Export/Import</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 'var(--spacing-md)' }}>Export or import data as JSON</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleExportJson} style={{ flex: 1, padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Export</button>
            <button onClick={handleBrowseImportJson} style={{ flex: 1, padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Import</button>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-md)', color: '#1e293b' }}>CSV Import / Export</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        {['customers', 'vendors', 'items'].map(type => (
          <div key={type} style={{ padding: 'var(--spacing-md)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <h4 style={{ textTransform: 'capitalize', marginBottom: 'var(--spacing-sm)', color: '#1e293b' }}>{type}</h4>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => handleExportCsv(type)} style={{ flex: 1, padding: '8px', background: '#475569', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.82rem' }}>Export</button>
              <button onClick={() => handleImportCsv(type)} style={{ flex: 1, padding: '8px', background: '#475569', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.82rem' }}>Import</button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-md)', color: '#1e293b' }}>Migrate from Previous Version</h2>
      <div style={{ padding: 'var(--spacing-md)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>Source Data Path</label>
            <input value={sourcePath} onChange={(e) => setSourcePath(e.target.value)} placeholder="Path to old app data" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
          </div>
          <button onClick={async () => {
            if (!sourcePath) return;
            setProgress({ percent: 20, status: 'Migrating...' });
            try {
              const bus = getCommandBus();
              const result = await bus.invoke('backup:runMigration', { sourcePath });
              if (result.success) setProgress({ percent: 100, status: 'Migration complete' });
              else setError(result.error || 'Migration failed');
            } catch (err) { setError(err.message); }
            finally { setTimeout(() => setProgress(null), 3000); }
          }} disabled={!sourcePath} style={{ padding: '8px 20px', background: sourcePath ? '#d97706' : '#9ca3af', color: '#fff', border: 'none', borderRadius: '6px', cursor: sourcePath ? 'pointer' : 'default', fontWeight: 600 }}>Run Migration</button>
        </div>
      </div>

      {importPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: 'min(94vw, 800px)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Import Preview: {importType}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Review data before importing. Rows with errors will be skipped.</div>
              </div>
              <button onClick={() => setImportPreview(null)} style={{ padding: '6px 14px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ padding: '16px 22px', display: 'flex', gap: '12px' }}>
              <div style={{ padding: '8px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontWeight: 700, color: '#166534' }}>{validCount} Valid</div>
              {errorCount > 0 && <div style={{ padding: '8px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: 700, color: '#dc2626' }}>{errorCount} Errors</div>}
              <div style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: 700, color: '#475569' }}>{importPreview.results.length} Total</div>
            </div>
            <div style={{ padding: '0 22px', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0', width: '30px' }}></th>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0', width: '50px' }}>Row</th>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Details</th>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left', minWidth: '150px' }}>Issues</th>
                </tr></thead>
                <tbody>
                  {importPreview.results.map((r, i) => (
                    <tr key={i} style={{ background: r.valid ? '#fff' : '#fff5f5' }}>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', color: r.valid ? '#16a34a' : '#dc2626', fontWeight: 800 }}>{r.valid ? '✓' : '✗'}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>{i + 2}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: 600 }}>{r.obj.name || '(empty)'}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem' }}>
                        {[r.obj.email, r.obj.phone, r.obj.gstin && `GSTIN: ${r.obj.gstin}`, r.obj.defaultRate != null && `Rate: ${r.obj.defaultRate}`, r.obj.taxRate != null && `Tax: ${r.obj.taxRate}%`].filter(Boolean).join(' | ')}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                        {r.errors.map((e, j) => <span key={j} style={{ color: '#dc2626', display: 'block' }}>{e}</span>)}
                        {r.warnings.map((w, j) => <span key={j} style={{ color: '#f59e0b', display: 'block' }}>{w}</span>)}
                        {r.valid && !r.warnings.length && <span style={{ color: '#16a34a' }}>OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 22px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setImportPreview(null)} style={{ padding: '8px 20px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmImport} disabled={validCount === 0} style={{ padding: '8px 20px', background: validCount > 0 ? '#16a34a' : '#9ca3af', color: '#fff', border: 'none', borderRadius: '6px', cursor: validCount > 0 ? 'pointer' : 'default', fontWeight: 700 }}>Import {validCount} Valid {importType}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
