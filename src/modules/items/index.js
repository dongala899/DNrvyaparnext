import manifest from './module.json' with { type: 'json' };
import { ItemService } from './application/service.js';
import { registerCommands } from './ports/commands.port.js';
import { registerSubscriptions } from './ports/events.port.js';

let _initialized = false;
let _core = null;
let _shell = null;
let _service = null;

async function registerRoutes(router) {
  const ItemListPage = (await import('./ui/ItemListPage.jsx')).default;
  const ItemDetailPage = (await import('./ui/ItemDetailPage.jsx')).default;
  const ItemFormPage = (await import('./ui/ItemFormPage.jsx')).default;

  router.register([
    { path: '/items', element: ItemListPage, handle: { title: 'Items' } },
    { path: '/items/new', element: ItemFormPage, handle: { title: 'New Item' } },
    { path: '/items/:id', element: ItemDetailPage, handle: { title: 'Item Details' } },
    { path: '/items/:id/edit', element: ItemFormPage, handle: { title: 'Edit Item' } },
  ]);
}

export default {
  manifest,

  async init(core, shell) {
    if (_initialized) return this;
    _core = core;
    _shell = shell;

    _service = new ItemService({
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
    core.logger.info('[items] Module initialized');
    return this;
  },

  async teardown() {
    if (!_initialized) return;
    _initialized = false;
  },

  get service() { return _service; },
  get store() { return _service?.store; },
};