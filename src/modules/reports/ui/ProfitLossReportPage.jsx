import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProfitLossReportPage() {
  const [filter, setFilter] = useState({ dateFrom: '', dateTo: '', companyId: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const commandBus = window.__shell?.commandBus;
    const result = await commandBus.invoke('report:getProfitLoss', filter);
    if (result.success) setReport(result.data);
    setLoading(false);
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h1>Profit & Loss</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', alignItems: 'center' }}>
        <input type="date" value={filter.dateFrom} onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })} />
        <input type="date" value={filter.dateTo} onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })} />
        <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">{loading ? 'Generating...' : 'Generate'}</button>
        <Link to="/reports" className="btn btn-secondary">Back</Link>
      </div>
      {report && (
        <div className="data-card">
          <p>Revenue: ₹{report.revenue}</p>
          <p>Cost of Goods: ₹{report.costOfGoods}</p>
          <p>Gross Profit: ₹{report.grossProfit}</p>
          <p>Expenses: ₹{report.expenses}</p>
          <p><strong>Net Profit: ₹{report.netProfit}</strong></p>
        </div>
      )}
    </div>
  );
}