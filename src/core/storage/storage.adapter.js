export function createStorageAdapter(prefix = '') {
  if (!window.api?.storage) {
    return { runQuery: async () => ({ success: true, data: [] }), runMigration: async () => ({ success: true }), transaction: async (fn) => fn() };
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