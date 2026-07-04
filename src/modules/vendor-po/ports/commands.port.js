export function registerCommands(commandBus, service) {
  commandBus.handle('po:create', async (payload) => { try { return await service.create(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('po:update', async (payload) => { try { return await service.update(payload.id, payload.data); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('po:delete', async (payload) => { try { return await service.delete(payload.id); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('po:getById', async (payload) => { try { const po = await service.findById(payload.id); return { success: true, data: po }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('po:getList', async (payload) => { try { return await service.getList(payload || {}); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('po:createGrn', async (payload) => { try { return await service.createGrn(payload.poId, payload.data); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('grn:getList', async (payload) => { try { return await service.getGrnList(payload || {}); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('grn:getById', async (payload) => { try { return await service.getGrnById(payload.id); } catch (error) { return { success: false, error: error.message }; } });
}