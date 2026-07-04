import { LicenseService } from '../application/service.js';

export function registerCommands(commandBus, service) {
  commandBus.handle('license:validate', async (payload) => {
    try {
      return await service.activate(payload.key);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('license:activate', async (payload) => {
    try {
      return await service.activate(payload.key);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('license:getStatus', async () => {
    try {
      return await service.getStatus();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export function unregisterCommands() {
}