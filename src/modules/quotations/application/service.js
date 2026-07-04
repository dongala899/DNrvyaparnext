import { createQuotation, createLineItem } from '../domain/entities.js';
import { QuotationNotFoundError } from '../domain/errors.js';

function getFinancialYearLabel(dateValue) {
  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = parsed.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  const startYearShort = String(startYear % 100).padStart(2, '0');
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYearShort}-${endYearShort}`;
}

export class QuotationService {
  constructor({ storage, commandBus, eventBus, logger, sharedState }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.store = { items: [], setItems: (items) => { this.store.items = items; } };
  }

  generateQuotationNumber(customerCode, dateValue) {
    const safeDate = String(dateValue || '').trim() || new Date().toISOString().split('T')[0];
    const fyLabel = getFinancialYearLabel(safeDate);
    const code = (customerCode || 'CUST').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

    const allQuotations = this.store.items || [];
    const matching = allQuotations.filter(q => {
      const qDate = q.date || q.quotationDate;
      return getFinancialYearLabel(qDate) === fyLabel;
    });

    let nextNumber = 1;
    matching.forEach(q => {
      const num = q.quotationNumber || q.refNumber || '';
      const match = String(num).match(/\/(\d+)\//);
      if (match) {
        nextNumber = Math.max(nextNumber, parseInt(match[1], 10) + 1);
      }
    });

    return `${fyLabel}/${String(nextNumber).padStart(2, '0')}/${code}/${fyLabel}`;
  }

  computeTotals(lines) {
    const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const taxAmount = lines.reduce((sum, l) => sum + (l.total - l.subtotal), 0);
    const discountAmount = lines.reduce((sum, l) => sum + l.discount, 0);
    return { subtotal, taxAmount, discountAmount, totalAmount: subtotal + taxAmount - discountAmount };
  }

  async create(data) {
    this.logger.info('Creating quotation', data.quotationNumber);

    const lines = data.lines.map(l => createLineItem(l));
    const totals = this.computeTotals(lines);

    const quotation = createQuotation({
      ...data,
      id: crypto.randomUUID(),
      quotationNumber: data.quotationNumber || this.generateQuotationNumber(data.customerCode, data.date),
      date: data.date || new Date().toISOString(),
      lines,
      ...totals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({ type: 'insert', table: 'quotations', values: {
      id: quotation.id,
      quotation_number: quotation.quotationNumber,
      customer_id: quotation.customerId,
      customer_name: quotation.customerName || null,
      company_id: quotation.companyId || null,
      date: quotation.date,
      validity_date: quotation.validityDate || null,
      subtotal: quotation.subtotal,
      tax_amount: quotation.taxAmount,
      discount_amount: quotation.discountAmount,
      total_amount: quotation.totalAmount,
      status: quotation.status,
      notes: quotation.notes || null,
      created_at: quotation.createdAt,
      updated_at: quotation.updatedAt,
    }});

    for (const line of lines) {
      await this.storage.runQuery({ type: 'insert', table: 'quotation_lines', values: {
        id: line.id,
        quotation_id: quotation.id,
        item_id: line.itemId,
        item_name: line.itemName || null,
        quantity: line.quantity,
        rate: line.rate,
        discount: line.discount,
        gst_rate: line.gstRate,
        subtotal: line.subtotal,
        total: line.total,
      }});
    }

    this.eventBus.emit('quotation:created', { quotation });
    return { success: true, data: quotation };
  }

  async update(id, data) {
    this.logger.info('Updating quotation', id);
    const existing = await this.findById(id);
    if (!existing) throw new QuotationNotFoundError(id);

    const lines = data.lines.map(l => createLineItem(l));
    const totals = this.computeTotals(lines);

    const quotation = createQuotation({
      ...existing,
      ...data,
      id,
      lines,
      ...totals,
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({ type: 'update', table: 'quotations', where: { id }, values: {
      quotation_number: quotation.quotationNumber,
      customer_id: quotation.customerId,
      customer_name: quotation.customerName || null,
      company_id: quotation.companyId || null,
      date: quotation.date,
      validity_date: quotation.validityDate || null,
      subtotal: quotation.subtotal,
      tax_amount: quotation.taxAmount,
      discount_amount: quotation.discountAmount,
      total_amount: quotation.totalAmount,
      status: quotation.status,
      notes: quotation.notes || null,
      updated_at: quotation.updatedAt,
    }});

    await this.storage.runQuery({ type: 'delete', table: 'quotation_lines', where: { quotation_id: id } });
    for (const line of lines) {
      await this.storage.runQuery({ type: 'insert', table: 'quotation_lines', values: {
        id: line.id, quotation_id: quotation.id, item_id: line.itemId,
        item_name: line.itemName || null, quantity: line.quantity, rate: line.rate,
        discount: line.discount, gst_rate: line.gstRate, subtotal: line.subtotal, total: line.total,
      }});
    }

    this.eventBus.emit('quotation:updated', { quotation });
    return { success: true, data: quotation };
  }

  async delete(id) {
    this.logger.info('Deleting quotation', id);
    const existing = await this.findById(id);
    if (!existing) throw new QuotationNotFoundError(id);

    await this.storage.runQuery({ type: 'delete', table: 'quotation_lines', where: { quotation_id: id } });
    await this.storage.runQuery({ type: 'delete', table: 'quotations', where: { id } });
    this.eventBus.emit('quotation:deleted', { id });
    return { success: true };
  }

  async findById(id) {
    const result = await this.storage.runQuery({ table: 'quotations', where: { id }, limit: 1 });
    const row = result?.data?.[0];
    if (!row) return null;

    const linesResult = await this.storage.runQuery({ table: 'quotation_lines', where: { quotation_id: row.id } });
    const lines = (linesResult?.data || []).map(lr => createLineItem({
      id: lr.id, itemId: lr.item_id, itemName: lr.item_name,
      quantity: lr.quantity, rate: lr.rate, discount: lr.discount,
      gstRate: lr.gst_rate, subtotal: lr.subtotal, total: lr.total,
    }));

    return createQuotation({
      id: row.id, quotationNumber: row.quotation_number, customerId: row.customer_id,
      customerName: row.customer_name || undefined, companyId: row.company_id || undefined,
      date: row.date, validityDate: row.validity_date || undefined, lines,
      subtotal: row.subtotal, taxAmount: row.tax_amount, discountAmount: row.discount_amount,
      totalAmount: row.total_amount, status: row.status, notes: row.notes || undefined,
      createdAt: row.created_at, updatedAt: row.updated_at,
    });
  }

  async getList(params = {}) {
    const { search, status, customerId, limit = 50, offset = 0 } = params;
    let sql = 'SELECT * FROM quotations WHERE 1=1';
    const whereValues = [];

    if (search) { sql += ' AND (quotation_number LIKE ? OR customer_name LIKE ?)'; whereValues.push(`%${search}%`, `%${search}%`); }
    if (status && status !== 'all') { sql += ' AND status = ?'; whereValues.push(status); }
    if (customerId) { sql += ' AND customer_id = ?'; whereValues.push(customerId); }
    sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    whereValues.push(limit, offset);

    const rows = await this.storage.runQuery({ type: 'custom', table: 'quotations', sql, values: whereValues });
    return { success: true, data: (rows?.data || []).map(row => ({
      id: row.id, quotationNumber: row.quotation_number, customerId: row.customer_id,
      customerName: row.customer_name || undefined, companyId: row.company_id || undefined,
      date: row.date, validityDate: row.validity_date || undefined,
      subtotal: row.subtotal, taxAmount: row.tax_amount, discountAmount: row.discount_amount,
      totalAmount: row.total_amount, status: row.status, notes: row.notes || undefined,
      createdAt: row.created_at, updatedAt: row.updated_at,
    })) };
  }
}