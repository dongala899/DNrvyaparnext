import { z } from 'zod';

export const AddressSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default('India'),
});

export const CustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: AddressSchema.optional(),
  creditLimit: z.number().min(0).default(0),
  creditDays: z.number().min(0).default(0),
  openingBalance: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const CustomerListParamsSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).default(50),
  offset: z.number().min(0).default(0),
});

export function createCustomer(data) {
  return CustomerSchema.parse(data);
}

export function createAddress(data) {
  return AddressSchema.parse(data);
}

export function createCustomerListParams(data) {
  return CustomerListParamsSchema.parse(data);
}