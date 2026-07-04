import manifest from './module.json' with { type: 'json' };
import { CustomerOrderService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _service = null;

async function registerRoutes(router) {
  const CustomerOrderListPage = (await import('./ui/CustomerOrderListPage.jsx')).default;
  const CustomerOrderFormPage = (await import('./ui/CustomerOrderFormPage.jsx')).default;
  const CustomerOrderDetailPage = (await import('./ui/CustomerOrderDetailPage.jsx')).default;
  const CustomerOrderPreviewPage = (await import('./ui/CustomerOrderPreviewPage.jsx')).default;
  router.register([
    { path: '/customer-orders', element: CustomerOrderListPage, handle: { title: 'Customer Orders' } },
    { path: '/customer-orders/new', element: CustomerOrderFormPage, handle: { title: 'New Customer Order' } },
    { path: '/customer-orders/:id', element: CustomerOrderDetailPage, handle: { title: 'Order Details' } },
    { path: '/customer-orders/:id/edit', element: CustomerOrderFormPage, handle: { title: 'Edit Order' } },
    { path: '/customer-orders/:id/preview', element: CustomerOrderPreviewPage, handle: { title: 'Order Preview' } },
  ]);
}

export default {
  manifest,

  async init(core, shell) {
    if (_initialized) return this;
    _service = new CustomerOrderService({
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
    core.logger.info('[customer-orders] Module initialized');
    return this;
  },

  async teardown() { if (_initialized) _initialized = false; },
  get service() { return _service; },
  get store() { return _service?.store; },
};
