import { CustomerService } from '../application/service.js';

export function registerCommands(commandBus, service) {
  commandBus.handle('customer:create', async (payload) => {
    try {
      return await service.create(payload);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('customer:update', async (payload) => {
    try {
      return await service.update(payload.id, payload.data);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('customer:delete', async (payload) => {
    try {
      return await service.delete(payload.id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('customer:getById', async (payload) => {
    try {
      const customer = await service.findById(payload.id);
      return { success: true, data: customer };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('customer:getList', async (payload) => {
    try {
      return await service.getList(payload || {});
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export function unregisterCommands() {
}