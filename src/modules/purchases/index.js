import manifest from './module.json' with { type: 'json' };
import { PurchaseService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _service = null;

async function registerRoutes(router) {
  const PurchaseListPage = (await import('./ui/PurchaseListPage.jsx')).default;
  const PurchaseDetailPage = (await import('./ui/PurchaseDetailPage.jsx')).default;
  const PurchaseFormPage = (await import('./ui/PurchaseFormPage.jsx')).default;
  router.register([
    { path: '/purchases', element: PurchaseListPage, handle: { title: 'Purchases' } },
    { path: '/purchases/new', element: PurchaseFormPage, handle: { title: 'New Purchase' } },
    { path: '/purchases/:id', element: PurchaseDetailPage, handle: { title: 'Purchase Details' } },
    { path: '/purchases/:id/edit', element: PurchaseFormPage, handle: { title: 'Edit Purchase' } },
  ]);
}

export default {
  manifest,
  async init(core, shell) {
    if (_initialized) return this;
    _service = new PurchaseService({ storage: core.storage, commandBus: shell.commandBus, eventBus: shell.eventBus, logger: core.logger, sharedState: shell.sharedState });
    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);
    _initialized = true;
    core.logger.info('[purchases] Module initialized');
    return this;
  },
  async teardown() { if (_initialized) _initialized = false; },
  get service() { return _service; },
  get store() { return _service?.store; },
};