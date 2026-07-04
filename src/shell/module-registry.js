const MODULES_DIR = import.meta.glob('../modules/*/module.json', { eager: true });

export function createModuleRegistry() {
  const registry = {
    _modules: new Map(),

    async discoverModules() {
      const discovered = [];

      for (const [filePath, manifestDefault] of Object.entries(MODULES_DIR)) {
        const manifest = manifestDefault.default || manifestDefault;
        const name = manifest.name;
        const modulePath = filePath.replace('/module.json', '');

        if (!name) {
          console.warn(`[Registry] Skipping ${filePath}: missing "name" in manifest`);
          continue;
        }

        discovered.push({
          name,
          manifest,
          path: modulePath,
          dependencies: manifest.dependencies || [],
        });
      }

      discovered.sort((a, b) => a.name.localeCompare(b.name));

      for (const mod of discovered) {
        this._modules.set(mod.name, mod);
      }

      return discovered;
    },

    getManifest(name) {
      const mod = this._modules.get(name);
      return mod ? mod.manifest : null;
    },

    getPath(name) {
      const mod = this._modules.get(name);
      return mod ? mod.path : null;
    },

    getModuleNames() {
      return Array.from(this._modules.keys());
    },

    has(name) {
      return this._modules.has(name);
    },

    getDependents(name) {
      const dependents = [];
      for (const [modName, mod] of this._modules) {
        if (mod.dependencies.includes(name)) {
          dependents.push(modName);
        }
      }
      return dependents;
    },

    validateDependencies() {
      const errors = [];
      for (const [name, mod] of this._modules) {
        for (const dep of mod.dependencies) {
          if (!this._modules.has(dep)) {
            errors.push(`Module "${name}" depends on "${dep}" which does not exist`);
          }
        }
      }
      return errors;
    },
  };

  return registry;
}