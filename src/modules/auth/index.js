import manifest from './module.json' with { type: 'json' };
import { AuthService } from './application/service.js';
import { registerCommands, unregisterCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';
import React from 'react';

let _initialized = false;
let _core = null;
let _shell = null;
let _service = null;

async function registerRoutes(router) {
  const { default: LoginPage } = await import('../../shared/components/LoginPage.jsx');
  const { default: DashboardPage } = await import('../../shared/components/DashboardPage.jsx');
  router.register([
    { path: '/login', element: React.createElement(LoginPage) },
    { path: '/dashboard', element: React.createElement(DashboardPage) },
  ]);
}

export default {
  manifest,

  async init(core, shell) {
    if (_initialized) return this;
    _core = core;
    _shell = shell;

    _service = new AuthService({
      storage: core.storage,
      commandBus: shell.commandBus,
      eventBus: shell.eventBus,
      logger: core.logger,
      sharedState: shell.sharedState,
      ipcAdapter: typeof window !== 'undefined' ? window.api : undefined,
    });

    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);

    _initialized = true;
    core.logger.info('[auth] Module initialized');
    return this;
  },

  async teardown() {
    if (!_initialized) return;
    unregisterCommands();
    _initialized = false;
  },

  get service() { return _service; },
};