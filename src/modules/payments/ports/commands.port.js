export function registerCommands(commandBus, service) {
  commandBus.handle('payment:create', async (payload) => { try { return await service.create(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('payment:update', async (payload) => { try { return await service.update(payload.id, payload.data); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('payment:delete', async (payload) => { try { return await service.delete(payload.id); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('payment:getById', async (payload) => { try { const p = await service.findById(payload.id); return { success: true, data: p }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('payment:getList', async (payload) => { try { return await service.getList(payload || {}); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('payment:allocateToInvoice', async (payload) => { try { return await service.create({ ...payload, paymentDate: new Date().toISOString() }); } catch (error) { return { success: false, error: error.message }; } });
}