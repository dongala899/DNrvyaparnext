export function registerCommands(commandBus, service) {
  commandBus.handle('quotation:create', async (payload) => { try { return await service.create(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('quotation:update', async (payload) => { try { return await service.update(payload.id, payload.data); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('quotation:delete', async (payload) => { try { return await service.delete(payload.id); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('quotation:getById', async (payload) => { try { const q = await service.findById(payload.id); return { success: true, data: q }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('quotation:getList', async (payload) => { try { return await service.getList(payload || {}); } catch (error) { return { success: false, error: error.message }; } });
}