import { CompanyService } from '../application/service.js';

export function registerCommands(commandBus, service) {
  commandBus.handle('company:create', async (payload, user) => {
    try {
      return await service.create(payload, user);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('company:update', async (payload, user) => {
    try {
      return await service.update(payload.id, payload.data, user);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('company:getById', async (payload) => {
    try {
      const company = await service.findById(payload.id);
      return { success: true, data: company };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('company:getList', async () => {
    try {
      return await service.getList();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('company:setCurrent', async (payload) => {
    try {
      return await service.setCurrent(payload.companyId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('company:getCurrent', async () => {
    try {
      const company = service.getCurrent();
      return { success: true, data: company };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export function unregisterCommands() {
}