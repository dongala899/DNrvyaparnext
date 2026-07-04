import React from 'react';
import { Link } from 'react-router-dom';

const reportCategories = [
  { title: 'Financial Reports', items: [{ name: 'Ledger', path: '/reports/ledger' }, { name: 'Profit & Loss', path: '/reports/profit-loss' }, { name: 'Balance Sheet', path: '/reports/balance-sheet' }] },
  { title: 'Inventory Reports', items: [{ name: 'Stock', path: '/reports/stock' }] },
  { title: 'Transaction Reports', items: [{ name: 'Daybook', path: '/reports/daybook' }] },
];

export default function ReportListPage() {
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h1>Reports</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
        {reportCategories.map(cat => (
          <div key={cat.title} className="data-card">
            <h3>{cat.title}</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {cat.items.map(item => (
                <li key={item.name}><Link to={item.path}>{item.name}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}