import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackupRestoreService } from '../../src/modules/backup-restore/application/service.js';
import { createBackupRecord, createMigrationResult } from '../../src/modules/backup-restore/domain/entities.js';

describe('BackupRestoreService', () => {
  let service, mockDeps;

  beforeEach(() => {
    mockDeps = {
      storage: { getDbPath: () => '/tmp/test.db' },
      commandBus: { invoke: vi.fn().mockResolvedValue({ success: true, data: [] }) },
      eventBus: { emit: vi.fn() },
      logger: { info: vi.fn(), error: vi.fn() },
      sharedState: {},
      ipcAdapter: {
        storage: {
          backup: {
            create: vi.fn().mockResolvedValue({ success: true, data: { id: '1', filename: 'backup.db', type: 'sqlite', size: 1024 } }),
            restore: vi.fn().mockResolvedValue({ success: false, error: 'Backup file not found' }),
            export: { json: vi.fn().mockResolvedValue({ success: true, filePath: '/tmp/export.json', data: {} }) },
            import: { json: vi.fn().mockResolvedValue({ success: false, error: 'File not found' }) },
          },
        },
        data: {
          exportCsv: vi.fn().mockResolvedValue({ success: true, filePath: '/tmp/export.csv' }),
          importCsv: vi.fn().mockResolvedValue({ success: true, data: '' }),
        },
      },
    };
    service = new BackupRestoreService(mockDeps);
  });

  describe('createBackup', () => {
    it('should create a backup record', async () => {
      const result = await service.createBackup('sqlite');
      expect(result.success).toBe(true);
      expect(result.data.type).toBe('sqlite');
    });
  });

  describe('restoreBackup', () => {
    it('should throw if file not found', async () => {
      await expect(service.restoreBackup('nonexistent.db', 'sqlite')).rejects.toThrow('Backup file not found');
    });
  });

  describe('exportJson', () => {
    it('should export data', async () => {
      const result = await service.exportJson();
      expect(result.success).toBe(true);
    });
  });

  describe('importJson', () => {
    it('should throw if file not found', async () => {
      await expect(service.importJson('/nonexistent.json')).rejects.toThrow('File not found');
    });
  });

  describe('runOldAppMigration', () => {
    it('should migrate successfully', async () => {
      const result = await service.runOldAppMigration('/old/app');
      expect(result.success).toBe(true);
    });
  });
});

describe('Backup Entity', () => {
  it('should create valid backup record', () => {
    const record = createBackupRecord({ id: '1', filename: 'test.db', type: 'sqlite', size: 1024 });
    expect(record.id).toBe('1');
    expect(record.type).toBe('sqlite');
  });
});

describe('Migration Entity', () => {
  it('should create valid migration result', () => {
    const result = createMigrationResult({ success: true, migratedTables: ['users'] });
    expect(result.success).toBe(true);
    expect(result.migratedTables).toContain('users');
  });
});