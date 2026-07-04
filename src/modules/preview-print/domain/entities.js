import { z } from 'zod';

export const PreviewStateSchema = z.object({
  isOpen: z.boolean().default(false),
  title: z.string().optional(),
  html: z.string().optional(),
  printSettings: z.object({
    printer: z.string().optional(),
    copies: z.number().default(1),
    landscape: z.boolean().default(false),
  }).optional(),
});

export const PrintQueueItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  html: z.string(),
  status: z.enum(['pending', 'printing', 'completed', 'failed']).default('pending'),
  createdAt: z.string().datetime().optional(),
});

export function createPreviewState(data) { return PreviewStateSchema.parse(data); }
export function createPrintQueueItem(data) { return PrintQueueItemSchema.parse(data); }