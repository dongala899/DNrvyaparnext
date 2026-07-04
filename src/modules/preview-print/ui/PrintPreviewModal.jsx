import React, { useState, useEffect } from 'react';

export default function PrintPreviewModal({ open, onClose, title, html, onSave, onPrint }) {
  const [settings, setSettings] = useState({ copies: 1, landscape: false });

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-lg)', borderRadius: '8px', width: '90vw', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2>{title || 'Print Preview'}</h2>
          <button onClick={onClose} className="btn btn-secondary">×</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--color-border)', marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', backgroundColor: '#fff' }} dangerouslySetInnerHTML={{ __html: html || '' }} />
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
          <button onClick={onPrint} className="btn btn-primary">Print</button>
          <button onClick={onSave} className="btn btn-secondary">Save PDF</button>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}