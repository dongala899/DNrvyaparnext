export function registerCommands(commandBus, service) {
  commandBus.handle('purchase:create', async (payload) => { try { return await service.create(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('purchase:update', async (payload) => { try { return await service.update(payload.id, payload.data); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('purchase:delete', async (payload) => { try { return await service.delete(payload.id); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('purchase:getById', async (payload) => { try { const p = await service.findById(payload.id); return { success: true, data: p }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('purchase:getList', async (payload) => { try { return await service.getList(payload || {}); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('purchase:createFromGrn', async (payload) => { try { return await service.createFromGrn(payload.grnId); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('vendorPayment:create', async (payload) => { try { return await service.createVendorPayment(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('vendorPayment:getList', async (payload) => { try { return await service.getVendorPayments(payload || {}); } catch (error) { return { success: false, error: error.message }; } });
}