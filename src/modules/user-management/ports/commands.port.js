import { UserService } from '../application/service.js';

export function registerCommands(commandBus, service) {
  commandBus.handle('user:create', async (payload, user) => {
    try {
      return await service.create(payload, user);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('user:update', async (payload, user) => {
    try {
      return await service.update(payload.id, payload.data, user);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('user:getById', async (payload) => {
    try {
      const user = await service.findById(payload.id);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('user:getList', async () => {
    try {
      return await service.getList();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('user:deactivate', async (payload, user) => {
    try {
      return await service.deactivate(payload.id, user);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('user:activate', async (payload) => {
    try {
      return await service.activate(payload.id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export function unregisterCommands() {
}