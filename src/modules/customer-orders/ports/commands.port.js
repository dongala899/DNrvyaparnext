import { CustomerOrderService } from '../application/service.js';

export function registerCommands(commandBus, service) {
  commandBus.handle('customerOrder:create', async (payload) => {
    try {
      return await service.create(payload);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('customerOrder:update', async (payload) => {
    try {
      return await service.update(payload.id, payload.data);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('customerOrder:getById', async (payload) => {
    try {
      const order = await service.findById(payload.id);
      if (!order) return { success: false, error: 'Order not found' };
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('customerOrder:getList', async (payload) => {
    try {
      return await service.getList(payload);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('customerOrder:delete', async (payload) => {
    try {
      return await service.delete(payload.id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('customerOrder:convertToInvoice', async (payload) => {
    try {
      return await service.convertToInvoice(payload.id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('customerOrder:getNextNumber', async () => {
    return { success: true, data: service.generateOrderNumber() };
  });
}
