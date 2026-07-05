import { z } from 'zod';

export const VendorSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().optional(),
  name: z.string().min(1, 'Vendor name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default('India'),
  paymentTerms: z.string().optional(),
  openingBalance: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export function createVendor(data) {
  return VendorSchema.parse(data);
}

export function getCompanyId(sharedState) {
  return sharedState.getState().currentCompany?.id;
}
