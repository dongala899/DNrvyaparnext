import manifest from './module.json' with { type: 'json' };
import { QuotationService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _service = null;

async function registerRoutes(router) {
  const QuotationListPage = (await import('./ui/QuotationListPage.jsx')).default;
  const QuotationDetailPage = (await import('./ui/QuotationDetailPage.jsx')).default;
  const QuotationFormPage = (await import('./ui/QuotationFormPage.jsx')).default;
  router.register([
    { path: '/quotations', element: QuotationListPage, handle: { title: 'Quotations' } },
    { path: '/quotations/new', element: QuotationFormPage, handle: { title: 'New Quotation' } },
    { path: '/quotations/:id', element: QuotationDetailPage, handle: { title: 'Quotation Details' } },
    { path: '/quotations/:id/edit', element: QuotationFormPage, handle: { title: 'Edit Quotation' } },
  ]);
}

export default {
  manifest,
  async init(core, shell) {
    if (_initialized) return this;
    _service = new QuotationService({ storage: core.storage, commandBus: shell.commandBus, eventBus: shell.eventBus, logger: core.logger, sharedState: shell.sharedState });
    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);
    _initialized = true;
    core.logger.info('[quotations] Module initialized');
    return this;
  },
  async teardown() { if (_initialized) _initialized = false; },
  get service() { return _service; },
  get store() { return _service?.store; },
};