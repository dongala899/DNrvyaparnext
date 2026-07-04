import { z } from 'zod';

export const CartLineSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().optional(),
  quantity: z.number().min(1),
  rate: z.number().min(0),
  discount: z.number().min(0).default(0),
  gstRate: z.number().min(0).max(100).default(18),
  subtotal: z.number().min(0),
  total: z.number().min(0),
});

export const PosStateSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  lines: z.array(CartLineSchema).default([]),
  notes: z.string().optional(),
});

export function createCartLine(data) { return CartLineSchema.parse(data); }
export function createPosState(data) { return PosStateSchema.parse(data); }