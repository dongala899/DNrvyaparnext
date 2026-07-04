export const StoragePort = null;

export function createStorageAdapter(prefix = '') {
  if (!window.api?.storage) {
    throw new Error('window.api.storage not available');
  }

  return {
    async runQuery(options) {
      const result = await window.api.storage.runQuery({
        ...options,
        table: prefix ? `${prefix}${options.table}` : options.table,
      });
      return result;
    },

    async runMigration(name, sql) {
      return window.api.storage.runMigration({ name, sql });
    },

    async transaction(fn) {
      return fn();
    },
  };
}