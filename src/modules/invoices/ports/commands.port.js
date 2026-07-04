export function registerCommands(commandBus, service) {
  commandBus.handle('invoice:create', async (payload) => { try { return await service.create(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('invoice:update', async (payload) => { try { return await service.update(payload.id, payload.data); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('invoice:delete', async (payload) => { try { return await service.delete(payload.id); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('invoice:getById', async (payload) => { try { const invoice = await service.findById(payload.id); return { success: true, data: invoice }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('invoice:getList', async (payload) => { try { return await service.getList(payload || {}); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('invoice:convertFromQuotation', async (payload) => { try { return await service.convertFromQuotation(payload.quotationId); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('invoice:cancel', async (payload) => { try { return await service.cancel(payload.id); } catch (error) { return { success: false, error: error.message }; } });
}