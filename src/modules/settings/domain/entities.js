import { z } from 'zod';

export const SettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  dataType: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  description: z.string().optional(),
  updatedAt: z.string().datetime().optional(),
});

export function createSetting(data) {
  return SettingSchema.parse(data);
}