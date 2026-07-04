import React from 'react';
import ReactDOM from 'react-dom/client';
import { bootstrap } from './bootstrap.js';
import { installBrowserApiShim } from './shared/browser-api.js';

installBrowserApiShim();

const root = ReactDOM.createRoot(document.getElementById('root'));

async function init() {
  try {
    const { router } = await bootstrap();
    root.render(<router.render />);
  } catch (error) {
    console.error('[Main] Bootstrap failed:', error);
    root.render(
      <div style={{ padding: 'var(--spacing-xl)' }}>
        <h1>Failed to start</h1>
        <pre>{error.message}</pre>
      </div>
    );
  }
}

init();