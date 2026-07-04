export function registerCommands(commandBus, service) {
  commandBus.handle('vendor:create', async (payload) => { try { return await service.create(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('vendor:update', async (payload) => { try { return await service.update(payload.id, payload.data); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('vendor:delete', async (payload) => { try { return await service.delete(payload.id); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('vendor:getById', async (payload) => { try { const vendor = await service.findById(payload.id); return { success: true, data: vendor }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('vendor:getList', async (payload) => { try { return await service.getList(payload || {}); } catch (error) { return { success: false, error: error.message }; } });
}