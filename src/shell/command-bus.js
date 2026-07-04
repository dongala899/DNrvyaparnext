export function createCommandBus() {
  const handlers = new Map();

  const bus = {
    handle(commandName, handler) {
      if (handlers.has(commandName)) {
        console.warn(`[CommandBus] Overwriting handler for "${commandName}"`);
      }
      handlers.set(commandName, handler);
    },

    async invoke(commandName, payload, user) {
      const handler = handlers.get(commandName);
      if (!handler) {
        return { success: false, error: `No handler for command: ${commandName}` };
      }

      try {
        const result = await handler(payload, user);
        return result;
      } catch (error) {
        console.error(`[CommandBus] Command "${commandName}" failed:`, error);
        return { success: false, error: error.message };
      }
    },

    hasHandler(commandName) {
      return handlers.has(commandName);
    },

    removeHandler(commandName) {
      handlers.delete(commandName);
    },

    getRegisteredCommands() {
      return Array.from(handlers.keys());
    },
  };

  return bus;
}