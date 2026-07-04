import manifest from './module.json' with { type: 'json' };
import { InvoiceService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _service = null;

async function registerRoutes(router) {
  const InvoiceListPage = (await import('./ui/InvoiceListPage.jsx')).default;
  const InvoiceDetailPage = (await import('./ui/InvoiceDetailPage.jsx')).default;
  const InvoiceFormPage = (await import('./ui/InvoiceFormPage.jsx')).default;
  router.register([
    { path: '/invoices', element: InvoiceListPage, handle: { title: 'Invoices' } },
    { path: '/invoices/new', element: InvoiceFormPage, handle: { title: 'New Invoice' } },
    { path: '/invoices/:id', element: InvoiceDetailPage, handle: { title: 'Invoice Details' } },
    { path: '/invoices/:id/edit', element: InvoiceFormPage, handle: { title: 'Edit Invoice' } },
  ]);
}

export default {
  manifest,
  async init(core, shell) {
    if (_initialized) return this;
    _service = new InvoiceService({ storage: core.storage, commandBus: shell.commandBus, eventBus: shell.eventBus, logger: core.logger, sharedState: shell.sharedState });
    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);
    _initialized = true;
    core.logger.info('[invoices] Module initialized');
    return this;
  },
  async teardown() { if (_initialized) _initialized = false; },
  get service() { return _service; },
  get store() { return _service?.store; },
};