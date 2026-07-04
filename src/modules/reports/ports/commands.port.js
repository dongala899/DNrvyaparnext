export function registerCommands(commandBus, service) {
  commandBus.handle('report:getGstr1', async (payload) => { try { return await service.getGstr1(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('report:getGstr2b', async (payload) => { try { return { success: true, data: [] }; } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('report:getLedger', async (payload) => { try { return await service.getLedger(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('report:getProfitLoss', async (payload) => { try { return await service.getProfitLoss(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('report:getStock', async (payload) => { try { return await service.getStock(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('report:getBalanceSheet', async (payload) => { try { return await service.getBalanceSheet(payload); } catch (error) { return { success: false, error: error.message }; } });
}