export function registerCommands(commandBus, service) {
  commandBus.handle('pos:addLine', async (payload) => { try { return { success: true, data: await service.addLine(payload.itemId, payload.quantity, payload.rate, payload.discount, payload.gstRate, payload.itemName) }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('pos:updateLine', async (payload) => { try { return { success: true, data: service.updateLine(payload.lineId, payload.updates) }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('pos:removeLine', async (payload) => { try { return { success: true, data: service.removeLine(payload.lineId) }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('pos:resetCart', async () => { try { return { success: true, data: service.resetCart() }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('pos:createInvoiceFromCart', async () => { try { return await service.createInvoiceFromCart(); } catch (error) { return { success: false, error: error.message }; } });
}
