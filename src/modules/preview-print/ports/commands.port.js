export function registerCommands(commandBus, service) {
  commandBus.handle('preview:open', async (payload) => { try { return await service.openPreview(payload.html, payload.title); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('preview:close', async () => { try { return await service.closePreview(); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('print:exportDocument', async (payload) => { try { return await service.exportDocument(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('print:savePdf', async () => { try { return await service.savePdf(); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('print:send', async (payload) => { try { return await service.sendToPrinter(payload); } catch (error) { return { success: false, error: error.message }; } });
  commandBus.handle('printQueue:getList', async () => { try { return await service.getPrintQueue(); } catch (error) { return { success: false, error: error.message }; } });
}