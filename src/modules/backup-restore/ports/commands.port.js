import { BackupError, RestoreError, MigrationError } from '../domain/errors.js';

export function registerCommands(commandBus, service) {
  commandBus.handle('backup:create', async (payload) => {
    try {
      const result = await service.createBackup(payload.type || 'sqlite');
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('backup:restore', async (payload) => {
    try {
      const result = await service.restoreBackup(payload.filename, payload.type || 'sqlite');
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('backup:exportJson', async () => {
    try {
      const result = await service.exportJson();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('backup:importJson', async (payload) => {
    try {
      const result = await service.importJson(payload.filePath);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('migration:runOldApp', async (payload) => {
    try {
      const result = await service.runOldAppMigration(payload.sourcePath);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('data:exportCsv', async (payload) => {
    try {
      const result = await service.exportCsv(payload.entityType);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  commandBus.handle('data:importCsv', async (payload) => {
    try {
      const result = await service.importCsv(payload.entityType);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

export function unregisterCommands(commandBus) {
  const commands = ['backup:create', 'backup:restore', 'backup:exportJson', 'backup:importJson', 'migration:runOldApp'];
  commands.forEach(cmd => commandBus.removeHandler(cmd));
}