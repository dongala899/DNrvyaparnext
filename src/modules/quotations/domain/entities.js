import { z } from 'zod';

export const LineItemSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().optional(),
  itemName: z.string().optional(),
  quantity: z.number().min(1),
  rate: z.number().min(0),
  discount: z.number().min(0).default(0),
  gstRate: z.number().min(0).max(100).default(18),
  subtotal: z.number().min(0),
  total: z.number().min(0),
});

export const QuotationSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().optional(),
  quotationNumber: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().optional(),
  date: z.string().min(1),
  validityDate: z.string().optional(),
  lines: z.array(LineItemSchema),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  status: z.enum(['draft', 'final']).default('draft'),
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const QuotationListParamsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['draft', 'final', 'all']).default('all'),
  customerId: z.string().optional(),
  limit: z.number().min(1).default(50),
  offset: z.number().min(0).default(0),
});

export function createQuotation(data) { return QuotationSchema.parse(data); }
export function createLineItem(data) {
  const quantity = data.quantity || 0;
  const rate = data.rate || 0;
  const discount = data.discount || 0;
  const gstRate = data.gstRate ?? 18;
  const subtotal = data.subtotal ?? (quantity * rate - discount);
  const total = data.total ?? (subtotal + (subtotal * gstRate / 100));
  return LineItemSchema.parse({
    ...data,
    id: data.id || crypto.randomUUID(),
    subtotal,
    total,
  });
}
export function createQuotationListParams(data) { return QuotationListParamsSchema.parse(data); }

export function getCompanyId(sharedState) {
  return sharedState.getState().currentCompany?.id;
}
