import manifest from './module.json' with { type: 'json' };
import { PaymentService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _service = null;

async function registerRoutes(router) {
  const PaymentListPage = (await import('./ui/PaymentListPage.jsx')).default;
  const PaymentDetailPage = (await import('./ui/PaymentDetailPage.jsx')).default;
  const PaymentFormPage = (await import('./ui/PaymentFormPage.jsx')).default;
  router.register([
    { path: '/payments', element: PaymentListPage, handle: { title: 'Payments' } },
    { path: '/payments/new', element: PaymentFormPage, handle: { title: 'New Payment' } },
    { path: '/payments/:id', element: PaymentDetailPage, handle: { title: 'Payment Details' } },
    { path: '/payments/:id/edit', element: PaymentFormPage, handle: { title: 'Edit Payment' } },
  ]);
}

export default {
  manifest,
  async init(core, shell) {
    if (_initialized) return this;
    _service = new PaymentService({ storage: core.storage, commandBus: shell.commandBus, eventBus: shell.eventBus, logger: core.logger, sharedState: shell.sharedState });
    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);
    _initialized = true;
    core.logger.info('[payments] Module initialized');
    return this;
  },
  async teardown() { if (_initialized) _initialized = false; },
  get service() { return _service; },
  get store() { return _service?.store; },
};