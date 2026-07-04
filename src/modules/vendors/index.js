import manifest from './module.json' with { type: 'json' };
import { VendorService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _service = null;

async function registerRoutes(router) {
  const VendorListPage = (await import('./ui/VendorListPage.jsx')).default;
  const VendorDetailPage = (await import('./ui/VendorDetailPage.jsx')).default;
  const VendorFormPage = (await import('./ui/VendorFormPage.jsx')).default;
  router.register([
    { path: '/vendors', element: VendorListPage, handle: { title: 'Vendors' } },
    { path: '/vendors/new', element: VendorFormPage, handle: { title: 'New Vendor' } },
    { path: '/vendors/:id', element: VendorDetailPage, handle: { title: 'Vendor Details' } },
    { path: '/vendors/:id/edit', element: VendorFormPage, handle: { title: 'Edit Vendor' } },
  ]);
}

export default {
  manifest,
  async init(core, shell) {
    if (_initialized) return this;
    _service = new VendorService({ storage: core.storage, commandBus: shell.commandBus, eventBus: shell.eventBus, logger: core.logger, sharedState: shell.sharedState });
    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);
    _initialized = true;
    core.logger.info('[vendors] Module initialized');
    return this;
  },
  async teardown() { if (_initialized) _initialized = false; },
  get service() { return _service; },
  get store() { return _service?.store; },
};