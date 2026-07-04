import { SettingsService } from '../application/service.js';

export function registerCommands(commandBus, service) {
  commandBus.handle('settings:get', async (payload) => {
    try {
      return await service.get(payload.key);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('settings:set', async (payload) => {
    try {
      return await service.set(payload.key, payload.value, payload.dataType);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('settings:getAll', async () => {
    try {
      return await service.getAll();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('settings:reset', async () => {
    try {
      return await service.reset();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export function unregisterCommands() {
}