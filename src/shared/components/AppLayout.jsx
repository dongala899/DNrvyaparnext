import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../shell/shared-state.js';

const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/companies', label: 'Companies' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { path: '/customers', label: 'Customers' },
      { path: '/quotations', label: 'Quotations' },
      { path: '/invoices', label: 'Invoices' },
      { path: '/payments', label: 'Payments' },
      { path: '/customer-orders', label: 'Customer Orders' },
      { path: '/pos', label: 'Quick Billing' },
    ],
  },
  {
    title: 'Purchases',
    items: [
      { path: '/vendors', label: 'Vendors' },
      { path: '/items', label: 'Items' },
      { path: '/vendor-po', label: 'Purchase Orders' },
      { path: '/grn', label: 'GRN' },
      { path: '/purchases', label: 'Purchases' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { path: '/reports', label: 'Reports' },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/users', label: 'Users' },
      { path: '/backup-restore', label: 'Backup & Restore' },
      { path: '/settings', label: 'Settings' },
    ],
  },
];

export function AppLayout() {
  const location = useLocation();
  const currentUser = useStore(s => s.currentUser);
  const currentCompany = useStore(s => s.currentCompany);
  const appReady = useStore(s => s.appReady);
  const theme = useStore(s => s.theme);
  const toggleTheme = useStore(s => s.toggleTheme);
  const clearAuth = useStore(s => s.clearAuth);
  const navigate = useNavigate();

  useEffect(() => {
    if (appReady && !currentUser && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [currentUser, appReady, navigate, location.pathname]);

  if (!currentUser && appReady && location.pathname !== '/login') {
    return <Outlet />;
  }

  function handleLogout() {
    clearAuth();
    localStorage.removeItem('auth_token');
    navigate('/login');
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 style={{ fontSize: 'var(--font-size-lg)' }}>DNR Vyapar Next</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          {currentCompany && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
              {currentCompany.name}
            </span>
          )}
          <button onClick={toggleTheme} className="btn btn-sm" title="Toggle theme" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
            {currentUser?.fullName || 'Loading...'}
          </span>
          <button onClick={handleLogout} className="btn btn-sm" title="Logout" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}>
            Logout
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className="app-sidebar">
          <div style={{ padding: 'var(--spacing-md)', overflowY: 'auto' }}>
            {NAV_SECTIONS.map(section => (
              <div key={section.title} style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {section.title}
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {section.items.map(item => (
                    <li key={item.path} style={{ marginBottom: '2px' }}>
                      <Link
                        to={item.path}
                        className={isActive(item.path) ? 'active' : ''}
                        style={{
                          display: 'block',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          color: isActive(item.path) ? '#fff' : 'var(--color-sidebar-text)',
                          background: isActive(item.path) ? 'var(--color-sidebar-active)' : 'transparent',
                          fontWeight: isActive(item.path) ? '600' : '500',
                          fontSize: '0.85rem',
                        }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
