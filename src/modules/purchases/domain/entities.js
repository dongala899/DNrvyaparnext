import { z } from 'zod';

export const PurchaseLineSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().optional(),
  quantity: z.number().min(1),
  rate: z.number().min(0),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(18),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  inputTaxCredit: z.boolean().default(true),
});

export const PurchaseSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().optional(),
  billNumber: z.string().min(1),
  vendorId: z.string().min(1),
  vendorName: z.string().optional(),
  grnId: z.string().optional(),
  poId: z.string().optional(),
  date: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  lines: z.array(PurchaseLineSchema),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  status: z.enum(['draft', 'booked', 'cancelled']).default('draft'),
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export function createPurchaseLine(data) { return PurchaseLineSchema.parse(data); }
export function createPurchase(data) { return PurchaseSchema.parse(data); }

export function getCompanyId(sharedState) {
  return sharedState.getState().currentCompany?.id;
}
