import { core, initializeCore } from './core/index.js';
import { createModuleRegistry } from './shell/module-registry.js';
import { createLifecycleManager } from './shell/lifecycle-manager.js';
import { createCommandBus } from './shell/command-bus.js';
import { createEventBus } from './shell/event-bus.js';
import { createRouter } from './shell/router.jsx';
import { sharedState } from './shell/shared-state.js';

export async function bootstrap() {
  console.log('[Bootstrap] Starting renderer initialization...');

  console.log('[Bootstrap] Initializing shared state...');
  console.log('[Bootstrap]   ✓ Shared state ready');

  console.log('[Bootstrap] Initializing core services...');
  initializeCore(sharedState);
  console.log('[Bootstrap]   ✓ Storage adapter ready');
  console.log('[Bootstrap]   ✓ Logger adapter ready');
  console.log('[Bootstrap]   ✓ Company context adapter ready');
  console.log('[Bootstrap]   ✓ Permissions service ready');
  console.log('[Bootstrap]   ✓ Numbering service ready');
  console.log('[Bootstrap]   ✓ Tax service ready');

  console.log('[Bootstrap] Initializing shell services...');

  const commandBus = createCommandBus();
  console.log('[Bootstrap]   ✓ Command bus ready');

  const eventBus = createEventBus();
  console.log('[Bootstrap]   ✓ Event bus ready');

  const router = createRouter();
  console.log('[Bootstrap]   ✓ Router ready');

  console.log('[Bootstrap] Discovering modules...');
  const registry = createModuleRegistry();
  const modules = await registry.discoverModules();
  console.log(`[Bootstrap]   Found ${modules.length} module(s): ${modules.map(m => m.name).join(', ')}`);

  console.log('[Bootstrap] Loading modules...');
  const lifecycle = createLifecycleManager(registry, {
    core,
    shell: { commandBus, eventBus, router, sharedState },
  });

  await lifecycle.loadAll();
  console.log('[Bootstrap]   All modules loaded');

  console.log('[Bootstrap] Building router...');
  router.buildRouter();
  console.log(`[Bootstrap]   ✓ Router ready with ${router.getRoutes().length} module route(s)`);

  sharedState.setState({ appReady: true });

  window.__shell = { commandBus, eventBus, router, sharedState, registry, lifecycle };
  window.__core = core;

  console.log('[Bootstrap] Initialization complete');
  return { core, commandBus, eventBus, router, sharedState, registry };
}