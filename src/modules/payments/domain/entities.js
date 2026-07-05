import { z } from 'zod';

export const PaymentSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().optional(),
  invoiceId: z.string().min(1),
  customerId: z.string().min(1),
  amount: z.number().min(0.01, 'Payment amount must be positive'),
  paymentDate: z.string().datetime(),
  paymentMode: z.enum(['cash', 'bank', 'upi', 'card', 'cheque', 'other']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['completed', 'pending']).default('completed'),
  createdAt: z.string().datetime().optional(),
});

export const PaymentAllocationSchema = z.object({
  invoiceId: z.string().min(1),
  allocatedAmount: z.number().min(0.01),
});

export function createPayment(data) { return PaymentSchema.parse(data); }
export function createPaymentAllocation(data) { return PaymentAllocationSchema.parse(data); }

export function getCompanyId(sharedState) {
  return sharedState.getState().currentCompany?.id;
}
