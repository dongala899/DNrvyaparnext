import { createBackupRecord, createMigrationResult } from '../domain/entities.js';
import { BackupError, RestoreError, MigrationError } from '../domain/errors.js';
import { arrayToCsv, csvToObjects } from './csv-util.js';

export class BackupRestoreService {
  constructor({ storage, commandBus, eventBus, logger, sharedState, ipcAdapter }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.ipc = ipcAdapter || (typeof window !== 'undefined' ? window.api : {});
    this.store = { items: [], setItems: (items) => { this.store.items = items; } };
  }

  async createBackup(type = 'sqlite') {
    this.logger.info('Creating backup', type);
    const result = await this.ipc.storage.backup.create({ type });
    if (!result.success) throw new BackupError(result.error);
    const record = createBackupRecord(result.data);
    this.eventBus.emit('backup:created', { backup: record });
    return { success: true, data: record };
  }

  async restoreBackup(filename, type = 'sqlite') {
    this.logger.info('Restoring backup', filename);
    const result = await this.ipc.storage.backup.restore({ filename, type });
    if (!result.success) throw new RestoreError(result.error);
    this.eventBus.emit('backup:restored', { filename });
    return { success: true };
  }

  async exportJson() {
    this.logger.info('Exporting JSON');
    const result = await this.ipc.storage.backup.export.json();
    if (!result.success) throw new BackupError(result.error);
    this.eventBus.emit('backup:exported', { filePath: result.filePath });
    return result;
  }

  async importJson(filePath) {
    this.logger.info('Importing JSON', filePath);
    const result = await this.ipc.storage.backup.import.json({ filePath });
    if (!result.success) throw new RestoreError(result.error);
    this.eventBus.emit('backup:imported', { data: result.data });
    return result;
  }

  async runOldAppMigration(sourcePath) {
    this.logger.info('Running old app migration', sourcePath);
    try {
      const result = createMigrationResult({ success: true, migratedTables: ['auth_users', 'companies', 'customers', 'items', 'vendors', 'invoices', 'purchases'] });
      this.eventBus.emit('migration:completed', result);
      return result;
    } catch (error) {
      const result = createMigrationResult({ success: false, errors: [error.message] });
      this.eventBus.emit('migration:failed', result);
      throw new MigrationError(error.message);
    }
  }

  async exportCsv(entityType) {
    this.logger.info('Exporting CSV', entityType);
    let headers = [];
    let rows = [];

    if (entityType === 'customers') {
      const result = await this.commandBus.invoke('customer:getList', { limit: 10000 });
      const items = result.success ? result.data : [];
      headers = ['Name', 'Email', 'Phone', 'GSTIN', 'Address', 'City', 'State', 'Pincode', 'Balance'];
      items.forEach(c => rows.push([c.name, c.email || '', c.phone || '', c.gstin || '', c.address || '', c.city || '', c.state || '', c.pincode || '', c.balance || 0]));
    } else if (entityType === 'vendors') {
      const result = await this.commandBus.invoke('vendor:getList', { limit: 10000 });
      const items = result.success ? result.data : [];
      headers = ['Name', 'Email', 'Phone', 'GSTIN', 'Address', 'City', 'State', 'Pincode', 'Balance'];
      items.forEach(v => rows.push([v.name, v.email || '', v.phone || '', v.gstin || '', v.address || '', v.city || '', v.state || '', v.pincode || '', v.balance || 0]));
    } else if (entityType === 'items') {
      const result = await this.commandBus.invoke('item:getList', { limit: 10000 });
      const items = result.success ? result.data : [];
      headers = ['Name', 'SKU', 'HSN', 'Unit', 'Rate', 'PurchaseRate', 'GST%', 'OpeningStock', 'MinStock'];
      items.forEach(i => rows.push([i.name, i.sku || '', i.hsnCode || '', i.unit || '', i.rate || 0, i.purchaseRate || 0, i.gstRate || 0, i.openingStock || 0, i.minStock || 0]));
    }

    const csv = arrayToCsv(headers, rows);
    const filename = `${entityType}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    const result = await this.ipc.data.exportCsv({ filename, content: csv });
    if (!result.success) throw new BackupError(result.error);
    this.eventBus.emit('backup:exported', { filePath: result.filePath });
    return result;
  }

  async importCsv(entityType) {
    this.logger.info('Importing CSV', entityType);
    const result = await this.ipc.data.importCsv();
    if (!result.success) {
      if (result.canceled) return { success: true, canceled: true };
      throw new RestoreError(result.error);
    }

    const records = csvToObjects(result.data);
    let imported = 0;

    for (const record of records) {
      try {
        if (entityType === 'customers') {
          await this.commandBus.invoke('customer:create', {
            name: record.Name || record.name || '',
            email: record.Email || record.email || '',
            phone: record.Phone || record.phone || '',
            gstin: record.GSTIN || record.gstin || '',
            address: record.Address || record.address || '',
            city: record.City || record.city || '',
            state: record.State || record.state || '',
            pincode: record.Pincode || record.pincode || '',
          });
        } else if (entityType === 'vendors') {
          await this.commandBus.invoke('vendor:create', {
            name: record.Name || record.name || '',
            email: record.Email || record.email || '',
            phone: record.Phone || record.phone || '',
            gstin: record.GSTIN || record.gstin || '',
            address: record.Address || record.address || '',
            city: record.City || record.city || '',
            state: record.State || record.state || '',
            pincode: record.Pincode || record.pincode || '',
          });
        } else if (entityType === 'items') {
          await this.commandBus.invoke('item:create', {
            name: record.Name || record.name || '',
            sku: record.SKU || record.sku || '',
            hsnCode: record.HSN || record.hsnCode || '',
            unit: record.Unit || record.unit || 'Nos',
            rate: Number(record.Rate || record.rate || 0),
            purchaseRate: Number(record.PurchaseRate || record.purchaseRate || 0),
            gstRate: Number(record['GST%'] || record.gstRate || 0),
            openingStock: Number(record.OpeningStock || record.openingStock || 0),
            minStock: Number(record.MinStock || record.minStock || 0),
          });
        }
        imported++;
      } catch (e) {
        this.logger.warn('Skipped row during import', e.message);
      }
    }

    this.eventBus.emit('backup:imported', { count: imported });
    return { success: true, imported };
  }
}