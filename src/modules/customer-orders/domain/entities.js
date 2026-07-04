import { z } from 'zod';

export const OrderLineSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().min(0.01),
  unit: z.string().default('Nos'),
  rate: z.number().min(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['percent', 'flat']).default('percent'),
  gstRate: z.number().min(0).max(100).default(18),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  total: z.number().min(0),
});

export const CustomerOrderSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().optional(),
  customerAddress: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  customerGstin: z.string().optional(),
  orderDate: z.string().min(1),
  expectedDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  status: z.enum(['draft', 'confirmed', 'cancelled', 'converted']).default('draft'),
  lines: z.array(OrderLineSchema).min(1, 'At least one line item is required'),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  roundOff: z.number().default(0),
  totalAmount: z.number().min(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export function createOrderLine(data) {
  const quantity = data.quantity || 0;
  const rate = data.rate || 0;
  const discount = data.discount || 0;
  const discountType = data.discountType || 'percent';
  const gstRate = data.gstRate ?? 18;

  const subtotal = quantity * rate;
  const discountAmount = discountType === 'percent' ? (subtotal * discount / 100) : discount;
  const taxableValue = subtotal - discountAmount;
  const taxAmount = taxableValue * (gstRate / 100);
  const total = taxableValue + taxAmount;

  return OrderLineSchema.parse({
    ...data,
    id: data.id || crypto.randomUUID(),
    subtotal,
    taxAmount,
    total,
  });
}

export function createCustomerOrder(data) {
  const lines = (data.lines || []).map(l => createOrderLine(l));
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0);
  const discountAmount = lines.reduce((s, l) => {
    const disc = l.discountType === 'percent' ? (l.subtotal * l.discount / 100) : l.discount;
    return s + disc;
  }, 0);
  const rawTotal = subtotal + taxAmount - discountAmount;
  const roundOff = Math.round(rawTotal) - rawTotal;
  const totalAmount = rawTotal + roundOff;

  return CustomerOrderSchema.parse({
    ...data,
    lines,
    subtotal,
    taxAmount,
    discountAmount,
    roundOff,
    totalAmount,
  });
}
