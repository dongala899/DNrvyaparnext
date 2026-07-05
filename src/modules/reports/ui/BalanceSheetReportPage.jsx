import React, { useState } from 'react';

export default function BalanceSheetReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [asOf, setAsOf] = useState(today);

  const generate = async () => {
    setLoading(true);
    try {
      const bus = window.__shell?.commandBus;
      if (!bus) throw new Error('Command bus not available');
      const result = await bus.invoke('report:getBalanceSheet', { dateFrom: '1970-01-01', dateTo: asOf });
      if (result.success) setData(result.data);
      else alert('Error: ' + result.error);
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2>Balance Sheet</h2>
      <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
        <label>As of:</label>
        <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {data && (
        <div className="data-card" style={{ maxWidth: 700 }}>
          <h3 style={{ textAlign: 'center' }}>Balance Sheet as of {data.period}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--spacing-md)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Liabilities</th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)' }}>Assets</th>
                <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: 'var(--spacing-sm)' }}>Sundry Creditors</td><td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{fmt(data.sundryCreditors)}</td><td style={{ padding: 'var(--spacing-sm)' }}>Sundry Debtors</td><td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{fmt(data.sundryDebtors)}</td></tr>
              <tr><td style={{ padding: 'var(--spacing-sm)' }}>Opening Capital</td><td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{fmt(data.openingCapital)}</td><td style={{ padding: 'var(--spacing-sm)' }}>Closing Stock</td><td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{fmt(data.closingStock)}</td></tr>
              <tr><td style={{ padding: 'var(--spacing-sm)' }}>Net Profit</td><td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{fmt(data.netProfit)}</td><td style={{ padding: 'var(--spacing-sm)' }}>Fixed Assets</td><td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{fmt(data.fixedAssets)}</td></tr>
              <tr><td style={{ padding: 'var(--spacing-sm)' }}>Less: Drawings</td><td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>({fmt(data.drawings)})</td><td></td><td></td></tr>
              <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 'bold' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}>Total</td><td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{fmt(data.totalLiabilities)}</td>
                <td style={{ padding: 'var(--spacing-sm)' }}>Total</td><td style={{ textAlign: 'right', padding: 'var(--spacing-sm)' }}>{fmt(data.totalAssets)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}