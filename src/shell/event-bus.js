export function createEventBus() {
  const listeners = new Map();

  const bus = {
    on(eventName, callback) {
      if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set());
      }
      listeners.get(eventName).add(callback);
    },

    once(eventName, callback) {
      const wrapper = (payload) => {
        this.off(eventName, wrapper);
        callback(payload);
      };
      this.on(eventName, wrapper);
    },

    emit(eventName, payload) {
      const callbacks = listeners.get(eventName);
      if (!callbacks) return;

      for (const callback of callbacks) {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[EventBus] Listener for "${eventName}" threw:`, error);
        }
      }
    },

    off(eventName, callback) {
      const callbacks = listeners.get(eventName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          listeners.delete(eventName);
        }
      }
    },

    removeAllListeners(eventName) {
      if (eventName) {
        listeners.delete(eventName);
      } else {
        listeners.clear();
      }
    },

    getRegisteredEvents() {
      return Array.from(listeners.keys());
    },
  };

  return bus;
}