export const LoggerPort = null;

export function createLoggerAdapter(moduleName = 'app') {
  const prefix = `[${moduleName}]`;

  return {
    debug(...args) {
      console.debug(prefix, ...args);
    },

    info(...args) {
      console.info(prefix, ...args);
    },

    warn(...args) {
      console.warn(prefix, ...args);
    },

    error(...args) {
      console.error(prefix, ...args);
    },
  };
}