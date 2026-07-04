export function registerCommands(commandBus, service) {
  commandBus.handle('item:create', async (payload) => {
    try { return await service.create(payload); }
    catch (error) { return { success: false, error: error.message }; }
  });

  commandBus.handle('item:update', async (payload) => {
    try { return await service.update(payload.id, payload.data); }
    catch (error) { return { success: false, error: error.message }; }
  });

  commandBus.handle('item:delete', async (payload) => {
    try { return await service.delete(payload.id); }
    catch (error) { return { success: false, error: error.message }; }
  });

  commandBus.handle('item:getById', async (payload) => {
    try {
      const item = await service.findById(payload.id);
      return { success: true, data: item };
    } catch (error) { return { success: false, error: error.message }; }
  });

  commandBus.handle('item:getList', async (payload) => {
    try { return await service.getList(payload || {}); }
    catch (error) { return { success: false, error: error.message }; }
  });
}