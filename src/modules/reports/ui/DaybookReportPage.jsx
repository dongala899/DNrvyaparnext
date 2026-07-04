import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function DaybookReportPage() {
  const [filter, setFilter] = useState({ dateFrom: '', dateTo: '', companyId: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const commandBus = window.__shell?.commandBus;
    const result = await commandBus.invoke('report:getDaybook', filter);
    if (result.success) setReport(result.data);
    setLoading(false);
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h1>Daybook</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', alignItems: 'center' }}>
        <input type="date" value={filter.dateFrom} onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })} />
        <input type="date" value={filter.dateTo} onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })} />
        <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">{loading ? 'Generating...' : 'Generate'}</button>
        <Link to="/reports" className="btn btn-secondary">Back</Link>
      </div>
      {report && (
        <table className="data-table">
          <thead><tr><th>Date</th><th>Particular</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
          <tbody>
            {report.map(r => <tr key={r.id}><td>{r.date}</td><td>{r.particular}</td><td>₹{r.debit}</td><td>₹{r.credit}</td><td>₹{r.balance}</td></tr>)}
          </tbody>
        </table>
      )}
    </div>
  );
}