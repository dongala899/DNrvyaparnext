import { z } from 'zod';

export const PoLineSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().optional(),
  quantity: z.number().min(1),
  receivedQuantity: z.number().min(0).default(0),
  rate: z.number().min(0),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  subtotal: z.number().min(0),
  total: z.number().min(0),
});

export const GrnLineSchema = z.object({
  id: z.string().min(1),
  poLineId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().min(1),
  rate: z.number().min(0),
});

export const PurchaseOrderSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().optional(),
  poNumber: z.string().min(1),
  vendorId: z.string().min(1),
  vendorName: z.string().optional(),
  date: z.string().datetime(),
  expectedDate: z.string().datetime().optional(),
  lines: z.array(PoLineSchema),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  status: z.enum(['draft', 'issued', 'closed', 'cancelled']).default('draft'),
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const GrnSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().optional(),
  grnNumber: z.string().min(1),
  poId: z.string().min(1),
  vendorId: z.string().optional(),
  date: z.string().datetime(),
  lines: z.array(GrnLineSchema),
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

export function createPoLine(data) { return PoLineSchema.parse(data); }
export function createGrnLine(data) { return GrnLineSchema.parse(data); }
export function createPurchaseOrder(data) { return PurchaseOrderSchema.parse(data); }
export function createGrn(data) { return GrnSchema.parse(data); }

export function getCompanyId(sharedState) {
  return sharedState.getState().currentCompany?.id;
}
