import manifest from './module.json' with { type: 'json' };
import { CompanyService } from './application/service.js';
import { registerCommands, unregisterCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _core = null;
let _shell = null;
let _service = null;

async function registerRoutes(router) {
  const CompanySelectPage = (await import('../../shared/components/CompanySelectPage.jsx')).default;
  router.register([
    { path: '/companies', element: CompanySelectPage, handle: { title: 'Companies' } },
    { path: '/select-company', element: CompanySelectPage, handle: { title: 'Select Company' } },
  ]);
}

export default {
  manifest,

  async init(core, shell) {
    if (_initialized) return this;
    _core = core;
    _shell = shell;

    _service = new CompanyService({
      storage: core.storage,
      commandBus: shell.commandBus,
      eventBus: shell.eventBus,
      logger: core.logger,
      sharedState: shell.sharedState,
    });

    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);

    const listResult = await _service.getList();
    if (listResult.success) {
      _service.store?.setItems(listResult.data);
    }

    _initialized = true;
    core.logger.info('[companies] Module initialized');
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