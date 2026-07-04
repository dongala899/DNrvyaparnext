import { z } from 'zod';

export const CompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Company name is required'),
  legalName: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  stateCode: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankIFSC: z.string().optional(),
  logoPath: z.string().optional(),
  signaturePath: z.string().optional(),
  quotationPrefix: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export function createCompany(data) {
  return CompanySchema.parse(data);
}