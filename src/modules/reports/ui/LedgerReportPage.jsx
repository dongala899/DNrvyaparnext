import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LedgerReportPage() {
  const [filter, setFilter] = useState({ dateFrom: '', dateTo: '', companyId: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const commandBus = window.__shell?.commandBus;
    const result = await commandBus.invoke('report:getLedger', filter);
    if (result.success) setReport(result.data);
    setLoading(false);
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h1>Ledger Report</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', alignItems: 'center' }}>
        <input type="date" value={filter.dateFrom} onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })} />
        <input type="date" value={filter.dateTo} onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })} />
        <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">{loading ? 'Generating...' : 'Generate'}</button>
        <Link to="/reports" className="btn btn-secondary">Back</Link>
      </div>
      {report && (
        <table className="data-table">
          <thead><tr><th>Party</th><th>Opening</th><th>Debit</th><th>Credit</th><th>Closing</th></tr></thead>
          <tbody>
            {report.map(r => <tr key={r.partyName}><td>{r.partyName}</td><td>{r.openingBalance}</td><td>{r.debit}</td><td>{r.credit}</td><td>{r.closingBalance}</td></tr>)}
          </tbody>
        </table>
      )}
    </div>
  );
}