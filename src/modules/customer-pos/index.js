import manifest from './module.json' with { type: 'json' };
import { PosService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _service = null;

async function registerRoutes(router) {
  const PosPage = (await import('./ui/PosPage.jsx')).default;
  router.register([
    { path: '/pos', element: PosPage, handle: { title: 'POS' } },
    { path: '/pos/customer/:customerId', element: PosPage, handle: { title: 'POS' } },
  ]);
}

export default {
  manifest,
  async init(core, shell) {
    if (_initialized) return this;
    _service = new PosService({ storage: core.storage, commandBus: shell.commandBus, eventBus: shell.eventBus, logger: core.logger, sharedState: shell.sharedState });
    registerCommands(shell.commandBus, _service);
    registerSubscriptions(shell.eventBus, _service);
    await registerRoutes(shell.router);
    _initialized = true;
    core.logger.info('[customer-pos] Module initialized');
    return this;
  },
  async teardown() { if (_initialized) _initialized = false; },
  get service() { return _service; },
  get cart() { return _service?.cart; },
};