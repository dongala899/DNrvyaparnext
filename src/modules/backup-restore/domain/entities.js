import { z } from 'zod';

export const BackupRecordSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  type: z.enum(['sqlite', 'json']).default('sqlite'),
  size: z.number().min(0),
  createdAt: z.string().datetime().optional(),
  status: z.enum(['success', 'failed']).default('success'),
});

export const MigrationResultSchema = z.object({
  success: z.boolean(),
  migratedTables: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
});

export function createBackupRecord(data) { return BackupRecordSchema.parse(data); }
export function createMigrationResult(data) { return MigrationResultSchema.parse(data); }