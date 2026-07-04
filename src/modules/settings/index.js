import manifest from './module.json' with { type: 'json' };
import { SettingsService } from './application/service.js';
import { registerCommands, unregisterCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _core = null;
let _shell = null;
let _service = null;

async function registerRoutes(router) {
  const { SettingsPage } = await import('./ui/SettingsPage.jsx');
  router.register([{
    path: '/settings',
    element: SettingsPage,
    handle: { title: 'Settings' },
  }]);
}

export default {
  manifest,

  async init(core, shell) {
    if (_initialized) return this;
    _core = core;
    _shell = shell;

    _service = new SettingsService({
      storage: core.storage,
      commandBus: shell.commandBus,
      eventBus: shell.eventBus,
      logger: core.logger,
    });

    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);

    const result = await _service.getAll();
    if (result.success) {
      _service.store?.setSettings(result.data);
    }

    _initialized = true;
    core.logger.info('[settings] Module initialized');
    return this;
  },

  async teardown() {
    if (!_initialized) return;
    unregisterCommands();
    _initialized = false;
  },

  get service() { return _service; },
};