import manifest from './module.json' with { type: 'json' };
import { CustomerService } from './application/service.js';
import { registerCommands, unregisterCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _core = null;
let _shell = null;
let _service = null;

async function registerRoutes(router) {
  const CustomerListPage = (await import('./ui/CustomerListPage.jsx')).default;
  const CustomerDetailPage = (await import('./ui/CustomerDetailPage.jsx')).default;
  const CustomerFormPage = (await import('./ui/CustomerFormPage.jsx')).default;

  router.register([
    { path: '/customers', element: CustomerListPage, handle: { title: 'Customers' } },
    { path: '/customers/new', element: CustomerFormPage, handle: { title: 'New Customer' } },
    { path: '/customers/:id', element: CustomerDetailPage, handle: { title: 'Customer Details' } },
    { path: '/customers/:id/edit', element: CustomerFormPage, handle: { title: 'Edit Customer' } },
  ]);
}

export default {
  manifest,

  async init(core, shell) {
    if (_initialized) return this;
    _core = core;
    _shell = shell;

    _service = new CustomerService({
      storage: core.storage,
      commandBus: shell.commandBus,
      eventBus: shell.eventBus,
      logger: core.logger,
      sharedState: shell.sharedState,
    });

    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);

    _initialized = true;
    core.logger.info('[customers] Module initialized');
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