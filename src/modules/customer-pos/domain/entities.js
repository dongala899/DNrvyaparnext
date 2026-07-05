import { z } from 'zod';

export const CartLineSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().optional(),
  quantity: z.number().min(1),
  rate: z.number().min(0),
  discount: z.number().min(0).default(0),
  gstRate: z.number().min(0).max(100).default(18),
  subtotal: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
});

export const PosStateSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  lines: z.array(CartLineSchema).default([]),
  notes: z.string().optional(),
});

export function createCartLine(data) {
  const quantity = data.quantity || 0;
  const rate = data.rate || 0;
  const discount = data.discount || 0;
  const gstRate = data.gstRate || 0;
  const subtotal = quantity * rate;
  const tax = subtotal * (gstRate / 100);
  const total = subtotal + tax - discount;

  return CartLineSchema.parse({
    ...data,
    subtotal,
    total,
  });
}

export function createPosState(data) { return PosStateSchema.parse(data); }

export function getCompanyId(sharedState) {
  return sharedState.getState().currentCompany?.id;
}
