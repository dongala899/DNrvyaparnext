import manifest from './module.json' with { type: 'json' };
import { BackupRestoreService } from './application/service.js';
import { registerCommands, unregisterCommands } from './ports/commands.port.js';

let _initialized = false;
let _core = null;
let _shell = null;
let _service = null;

async function registerRoutes(router) {
  const { BackupRestorePage } = await import('./ui/BackupRestorePage.jsx');
  router.register([{
    path: '/backup-restore',
    element: BackupRestorePage,
    handle: { title: 'Backup & Restore' },
  }]);
}

export default {
  manifest,

  async init(core, shell) {
    if (_initialized) return this;
    _core = core;
    _shell = shell;

    _service = new BackupRestoreService({
      storage: core.storage,
      commandBus: shell.commandBus,
      eventBus: shell.eventBus,
      logger: core.logger,
      sharedState: shell.sharedState,
    });

    registerCommands(shell.commandBus, _service);
    await registerRoutes(shell.router);

    _initialized = true;
    core.logger.info('[backup-restore] Module initialized');
    return this;
  },

  async teardown() {
    if (!_initialized) return;
    unregisterCommands(_shell.commandBus);
    _initialized = false;
  },

  get service() { return _service; },
};