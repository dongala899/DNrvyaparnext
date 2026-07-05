import { createReportFilter, createGstr1Report, createLedgerReport, createProfitLossReport, createStockReport, createDaybookReport, createBalanceSheet } from '../domain/entities.js';
import { getCompanyId } from '../domain/entities.js';

export class ReportsService {
  constructor({ storage, commandBus, eventBus, logger, sharedState }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.cache = new Map();
  }

  companyId() {
    return getCompanyId(this.sharedState);
  }

  async getGstr1(params) {
    const filter = createReportFilter(params);
    this.logger.info('Generating GSTR-1', filter);

    const dateFrom = filter.dateFrom || '1970-01-01';
    const dateTo = filter.dateTo || new Date().toISOString().split('T')[0];

    const result = await this.commandBus.invoke('invoice:getList', { ...filter, companyId: this.companyId(), dateFrom, dateTo, limit: 10000 });
    const invoices = result.success ? result.data : [];

    const taxableSupplies = invoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.totalAmount, 0);
    const centralTax = invoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.taxAmount / 2, 0);
    const stateTax = invoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.taxAmount / 2, 0);

    return { success: true, data: createGstr1Report({ period: `${filter.dateFrom} to ${filter.dateTo}`, taxableSupplies, integratedTax: 0, centralTax, stateTax, total: taxableSupplies + centralTax + stateTax }) };
  }

  async getLedger(params) {
    const filter = createReportFilter(params);
    this.logger.info('Generating Ledger', filter);

    const [custResult, venResult] = await Promise.all([
      this.commandBus.invoke('customer:getList', { companyId: this.companyId(), limit: 10000 }),
      this.commandBus.invoke('vendor:getList', { companyId: this.companyId(), limit: 10000 }),
    ]);

    const customers = custResult.success ? custResult.data : [];
    const vendors = venResult.success ? venResult.data : [];

    return { success: true, data: [...customers.map(c => createLedgerReport({ partyName: c.name, openingBalance: 0, debit: 0, credit: 0, closingBalance: 0 })), ...vendors.map(v => createLedgerReport({ partyName: v.name, openingBalance: 0, debit: 0, credit: 0, closingBalance: 0 }))] };
  }

  async getProfitLoss(params) {
    const filter = createReportFilter(params);
    this.logger.info('Generating Profit & Loss', filter);

    const dateFrom = filter.dateFrom || '1970-01-01';
    const dateTo = filter.dateTo || new Date().toISOString().split('T')[0];

    const [invResult, purResult] = await Promise.all([
      this.commandBus.invoke('invoice:getList', { ...filter, companyId: this.companyId(), dateFrom, dateTo, limit: 10000 }),
      this.commandBus.invoke('purchase:getList', { ...filter, companyId: this.companyId(), dateFrom, dateTo, limit: 10000 }),
    ]);

    const revenue = (invResult.success ? invResult.data : []).reduce((s, i) => s + i.totalAmount, 0);
    const costOfGoods = (purResult.success ? purResult.data : []).reduce((s, i) => s + i.totalAmount, 0);
    const grossProfit = revenue - costOfGoods;

    return { success: true, data: createProfitLossReport({ period: `${filter.dateFrom} to ${filter.dateTo}`, revenue, costOfGoods, grossProfit, expenses: 0, netProfit: grossProfit }) };
  }

  async getStock(params) {
    const filter = createReportFilter(params);
    this.logger.info('Generating Stock Report', filter);

    const result = await this.commandBus.invoke('item:getList', { companyId: this.companyId(), ...filter, limit: 10000 });
    const items = result.success ? result.data : [];

    return { success: true, data: items.map(item => createStockReport({ itemId: item.id, itemName: item.name, openingStock: item.openingStock || 0, purchases: 0, sales: 0, closingStock: item.openingStock || 0 })) };
  }

  async getDaybook(params) {
    const filter = createReportFilter(params);
    this.logger.info('Generating Daybook', filter);

    const dateFrom = filter.dateFrom || '1970-01-01';
    const dateTo = filter.dateTo || new Date().toISOString().split('T')[0];

    const [invResult, purResult] = await Promise.all([
      this.commandBus.invoke('invoice:getList', { ...filter, companyId: this.companyId(), dateFrom, dateTo, limit: 10000 }),
      this.commandBus.invoke('purchase:getList', { ...filter, companyId: this.companyId(), dateFrom, dateTo, limit: 10000 }),
    ]);

    const entries = [];
    (invResult.success ? invResult.data : []).forEach(inv => {
      entries.push(createDaybookReport({ id: inv.id, date: inv.date, particular: inv.customerName || '', debit: 0, credit: inv.totalAmount, balance: inv.totalAmount }));
    });
    (purResult.success ? purResult.data : []).forEach(pur => {
      entries.push(createDaybookReport({ id: pur.id, date: pur.date, particular: pur.vendorName || '', debit: pur.totalAmount, credit: 0, balance: -pur.totalAmount }));
    });

    return { success: true, data: entries.sort((a, b) => b.date.localeCompare(a.date)) };
  }

  async getBalanceSheet(params) {
    const filter = createReportFilter(params);
    this.logger.info('Generating Balance Sheet', filter);

    const dateFrom = filter.dateFrom || '1970-01-01';
    const dateTo = filter.dateTo || new Date().toISOString().split('T')[0];

    const [invResult, purResult, payResult] = await Promise.all([
      this.commandBus.invoke('invoice:getList', { ...filter, companyId: this.companyId(), dateFrom, dateTo, limit: 10000 }),
      this.commandBus.invoke('purchase:getList', { ...filter, companyId: this.companyId(), dateFrom, dateTo, limit: 10000 }),
      this.commandBus.invoke('payment:getList', { ...filter, companyId: this.companyId(), limit: 10000 }),
    ]);

    const totalRevenue = (invResult.success ? invResult.data : []).filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.totalAmount, 0);
    const totalPurchases = (purResult.success ? purResult.data : []).filter(p => p.status !== 'cancelled').reduce((s, p) => s + p.totalAmount, 0);
    const totalPayments = (payResult.success ? payResult.data : []).reduce((s, p) => s + (p.amount || 0), 0);

    const sundryDebtors = totalRevenue - totalPayments;
    const closingStock = 0;
    const fixedAssets = 0;
    const totalAssets = sundryDebtors + closingStock + fixedAssets;

    const sundryCreditors = totalPurchases;
    const openingCapital = 0;
    const netProfit = totalRevenue - totalPurchases;
    const totalLiabilities = sundryCreditors + openingCapital + netProfit;

    const data = createBalanceSheet({
      period: `${filter.dateTo}`,
      sundryDebtors,
      closingStock,
      fixedAssets,
      totalAssets,
      sundryCreditors,
      openingCapital,
      netProfit,
      drawings: 0,
      totalLiabilities,
    });

    return { success: true, data };
  }
}
