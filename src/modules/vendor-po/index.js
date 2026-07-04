import manifest from './module.json' with { type: 'json' };
import { VendorPoService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _service = null;

async function registerRoutes(router) {
  const PoListPage = (await import('./ui/PoListPage.jsx')).default;
  const PoDetailPage = (await import('./ui/PoDetailPage.jsx')).default;
  const PoFormPage = (await import('./ui/PoFormPage.jsx')).default;
  const GrnListPage = (await import('./ui/GrnListPage.jsx')).default;
  const GrnFormPage = (await import('./ui/GrnFormPage.jsx')).default;
  const GrnDetailPage = (await import('./ui/GrnDetailPage.jsx')).default;
  router.register([
    { path: '/vendor-po', element: PoListPage, handle: { title: 'Purchase Orders' } },
    { path: '/vendor-po/new', element: PoFormPage, handle: { title: 'New PO' } },
    { path: '/vendor-po/:id', element: PoDetailPage, handle: { title: 'PO Details' } },
    { path: '/vendor-po/:id/edit', element: PoFormPage, handle: { title: 'Edit PO' } },
    { path: '/grn', element: GrnListPage, handle: { title: 'GRNs' } },
    { path: '/grn/new', element: GrnFormPage, handle: { title: 'New GRN' } },
    { path: '/grn/:id', element: GrnDetailPage, handle: { title: 'GRN Details' } },
  ]);
}

export default {
  manifest,
  async init(core, shell) {
    if (_initialized) return this;
    _service = new VendorPoService({ storage: core.storage, commandBus: shell.commandBus, eventBus: shell.eventBus, logger: core.logger, sharedState: shell.sharedState });
    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);
    _initialized = true;
    core.logger.info('[vendor-po] Module initialized');
    return this;
  },
  async teardown() { if (_initialized) _initialized = false; },
  get service() { return _service; },
  get store() { return _service?.store; },
};