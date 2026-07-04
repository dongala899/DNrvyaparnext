const MODULE_INDEX_DIR = import.meta.glob('../modules/*/index.js', { eager: true });

export function createLifecycleManager(registry, services) {
  const manager = {
    _loaded: new Map(),

    async loadAll() {
      const errors = registry.validateDependencies();
      if (errors.length > 0) {
        throw new Error(`Dependency validation failed:\n${errors.join('\n')}`);
      }

      const order = this._topologicalSort();

      for (const moduleName of order) {
        await this._loadModule(moduleName);
      }
    },

    async _loadModule(name) {
      if (this._loaded.has(name)) return;

      const modulePath = `../modules/${name}/index.js`;
      const module = MODULE_INDEX_DIR[modulePath];

      if (!module || !module.default || typeof module.default.init !== 'function') {
        throw new Error(`Module "${name}" not found or invalid. Must export default { init(), teardown() }`);
      }

      console.log(`[Lifecycle] Loading module: ${name}`);

      await module.default.init(services.core, services.shell);

      this._loaded.set(name, module.default);
      console.log(`[Lifecycle]   ✓ ${name} loaded`);
    },

    _topologicalSort() {
      const names = registry.getModuleNames();
      const visited = new Set();
      const order = [];

      function visit(name) {
        if (visited.has(name)) return;
        visited.add(name);

        const manifest = registry.getManifest(name);
        if (manifest && manifest.dependencies) {
          for (const dep of manifest.dependencies) {
            visit(dep);
          }
        }

        order.push(name);
      }

      for (const name of names) {
        visit(name);
      }

      return order;
    },

    async teardownAll() {
      const names = Array.from(this._loaded.keys()).reverse();

      for (const name of names) {
        const mod = this._loaded.get(name);
        if (mod && typeof mod.teardown === 'function') {
          try {
            await mod.teardown();
            console.log(`[Lifecycle]   ✓ ${name} torn down`);
          } catch (error) {
            console.error(`[Lifecycle]   ✗ ${name} teardown failed:`, error);
          }
        }
      }

      this._loaded.clear();
    },

    isLoaded(name) {
      return this._loaded.has(name);
    },

    getModule(name) {
      return this._loaded.get(name) || null;
    },
  };

  return manager;
}