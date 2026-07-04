import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function StockReportPage() {
  const [filter, setFilter] = useState({ dateFrom: '', dateTo: '', companyId: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const commandBus = window.__shell?.commandBus;
    const result = await commandBus.invoke('report:getStock', filter);
    if (result.success) setReport(result.data);
    setLoading(false);
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h1>Stock Report</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', alignItems: 'center' }}>
        <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">{loading ? 'Generating...' : 'Generate'}</button>
        <Link to="/reports" className="btn btn-secondary">Back</Link>
      </div>
      {report && (
        <table className="data-table">
          <thead><tr><th>Item</th><th>Opening</th><th>Purchases</th><th>Sales</th><th>Closing</th></tr></thead>
          <tbody>
            {report.map(r => <tr key={r.itemId}><td>{r.itemName}</td><td>{r.openingStock}</td><td>{r.purchases}</td><td>{r.sales}</td><td>{r.closingStock}</td></tr>)}
          </tbody>
        </table>
      )}
    </div>
  );
}