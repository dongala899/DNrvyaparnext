import { z } from 'zod';

export const ItemSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  sku: z.string().optional(),
  hsnCode: z.string().optional(),
  unit: z.string().default('PCS'),
  purchasePrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  openingStock: z.number().default(0),
  lowStockAlert: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const ItemListParamsSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  lowStock: z.boolean().optional(),
  limit: z.number().min(1).default(50),
  offset: z.number().min(0).default(0),
});

export function createItem(data) {
  return ItemSchema.parse(data);
}

export function createItemListParams(data) {
  return ItemListParamsSchema.parse(data);
}

export function getCompanyId(sharedState) {
  return sharedState.getState().currentCompany?.id;
}
