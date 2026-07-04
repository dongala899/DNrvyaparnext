import manifest from './module.json' with { type: 'json' };
import { UserService } from './application/service.js';
import { registerCommands, unregisterCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _core = null;
let _shell = null;
let _service = null;

export default {
  manifest,

  async init(core, shell) {
    if (_initialized) return this;
    _core = core;
    _shell = shell;

    _service = new UserService({
      storage: core.storage,
      commandBus: shell.commandBus,
      eventBus: shell.eventBus,
      logger: core.logger,
      sharedState: shell.sharedState,
      ipcAdapter: typeof window !== 'undefined' ? window.api : undefined,
    });

    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);

    const { UserListPage } = await import('./ui/UserListPage.jsx');
    const { UserFormPage } = await import('./ui/UserFormPage.jsx');
    shell.router.register([
      { path: '/users', element: UserListPage, handle: { title: 'Users' } },
      { path: '/users/new', element: UserFormPage, handle: { title: 'New User' } },
    ]);

    const listResult = await _service.getList();
    if (listResult.success) {
      _service.store?.setItems(listResult.data);
    }

    _initialized = true;
    core.logger.info('[user-management] Module initialized');
    return this;
  },

  async teardown() {
    if (!_initialized) return;
    unregisterCommands();
    _initialized = false;
  },

  get service() { return _service; },
  get store() { return _service?.store; },
};