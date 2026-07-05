import { z } from 'zod';

export const ReportFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  companyId: z.string().optional(),
  customerId: z.string().optional(),
  vendorId: z.string().optional(),
});

export const Gstr1ReportSchema = z.object({
  period: z.string(),
  taxableSupplies: z.number(),
  integratedTax: z.number(),
  centralTax: z.number(),
  stateTax: z.number(),
  total: z.number(),
});

export const LedgerReportSchema = z.object({
  partyName: z.string(),
  openingBalance: z.number(),
  debit: z.number(),
  credit: z.number(),
  closingBalance: z.number(),
});

export const ProfitLossReportSchema = z.object({
  period: z.string(),
  revenue: z.number(),
  costOfGoods: z.number(),
  grossProfit: z.number(),
  expenses: z.number(),
  netProfit: z.number(),
});

export const StockReportSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  openingStock: z.number(),
  purchases: z.number(),
  sales: z.number(),
  closingStock: z.number(),
});

export const DaybookReportSchema = z.object({
  id: z.string(),
  date: z.string(),
  particular: z.string(),
  debit: z.number(),
  credit: z.number(),
  balance: z.number(),
});

export const BalanceSheetSchema = z.object({
  period: z.string(),
  sundryDebtors: z.number(),
  closingStock: z.number(),
  fixedAssets: z.number(),
  totalAssets: z.number(),
  sundryCreditors: z.number(),
  openingCapital: z.number(),
  netProfit: z.number(),
  drawings: z.number(),
  totalLiabilities: z.number(),
});

export function createReportFilter(data) { return ReportFilterSchema.parse(data); }
export function createGstr1Report(data) { return Gstr1ReportSchema.parse(data); }
export function createLedgerReport(data) { return LedgerReportSchema.parse(data); }
export function createProfitLossReport(data) { return ProfitLossReportSchema.parse(data); }
export function createStockReport(data) { return StockReportSchema.parse(data); }
export function createDaybookReport(data) { return DaybookReportSchema.parse(data); }
export function createBalanceSheet(data) { return BalanceSheetSchema.parse(data); }
export function getCompanyId(sharedState) {
  return sharedState.getState().currentCompany?.id;
}