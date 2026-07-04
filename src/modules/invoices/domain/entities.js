import { z } from 'zod';

export const LineItemSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().optional(),
  description: z.string().optional(),
  hsnSac: z.string().optional(),
  quantity: z.number().min(0.01),
  unit: z.string().default('Nos'),
  rate: z.number().min(0),
  discount: z.number().min(0).default(0),
  gstRate: z.number().min(0).max(100).default(18),
  cgstRate: z.number().min(0).default(0),
  sgstRate: z.number().min(0).default(0),
  igstRate: z.number().min(0).default(0),
  cgstAmount: z.number().min(0).default(0),
  sgstAmount: z.number().min(0).default(0),
  igstAmount: z.number().min(0).default(0),
  taxableAmount: z.number().min(0).default(0),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  total: z.number().min(0),
});

export const InvoiceSchema = z.object({
  id: z.string().min(1),
  invoiceNumber: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().optional(),
  customerState: z.string().optional(),
  companyId: z.string().optional(),
  companyInfo: z.any().optional(),
  date: z.string().min(1),
  dueDate: z.string().optional(),
  quotationId: z.string().optional(),
  poNumber: z.string().optional(),
  poDate: z.string().optional(),
  shippingAddress: z.string().optional(),
  customerPurchaseOrderId: z.string().optional(),
  roundOff: z.boolean().default(true),
  lines: z.array(LineItemSchema),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  roundOffAmount: z.number().default(0),
  totalAmount: z.number().min(0),
  cgst: z.number().min(0).default(0),
  sgst: z.number().min(0).default(0),
  igst: z.number().min(0).default(0),
  status: z.enum(['draft', 'confirmed', 'cancelled']).default('draft'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  einvoiceEnabled: z.boolean().default(false),
  einvoiceStatus: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export function createInvoice(data) { return InvoiceSchema.parse(data); }

export function createLineItem(data) {
  const quantity = data.quantity || 0;
  const rate = data.rate || 0;
  const discount = data.discount || 0;
  const gstRate = data.gstRate ?? 18;
  const subtotal = quantity * rate;
  const taxableAmount = subtotal - discount;

  const isInterState = data.isInterState === true;
  const cgstRate = isInterState ? 0 : gstRate / 2;
  const sgstRate = isInterState ? 0 : gstRate / 2;
  const igstRate = isInterState ? gstRate : 0;

  const cgstAmount = taxableAmount * cgstRate / 100;
  const sgstAmount = taxableAmount * sgstRate / 100;
  const igstAmount = taxableAmount * igstRate / 100;
  const taxAmount = cgstAmount + sgstAmount + igstAmount;
  const total = taxableAmount + taxAmount;

  return LineItemSchema.parse({
    ...data,
    id: data.id || crypto.randomUUID(),
    subtotal,
    taxableAmount,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxAmount,
    total,
  });
}
