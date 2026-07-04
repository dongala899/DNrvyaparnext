import { createInvoice, createLineItem } from '../domain/entities.js';
import { InvoiceNotFoundError, QuotationNotFoundError, InvalidInvoiceStateError } from '../domain/errors.js';

const INVOICE_EDIT_START_DAY = 10;

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

function canEditInvoiceRecord(savedInvoice) {
  if (!savedInvoice || savedInvoice.status === 'cancelled') return false;
  const dateValue = String(savedInvoice.date || '').trim();
  if (!dateValue) return false;
  const invoiceDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(invoiceDate.getTime())) return false;
  const now = new Date();
  const invoiceDay = invoiceDate.getDate();
  let lockYear, lockMonth;
  if (invoiceDay < INVOICE_EDIT_START_DAY) {
    lockYear = invoiceDate.getFullYear();
    lockMonth = invoiceDate.getMonth();
  } else {
    const nextMonth = invoiceDate.getMonth() + 1;
    lockYear = nextMonth > 11 ? invoiceDate.getFullYear() + 1 : invoiceDate.getFullYear();
    lockMonth = nextMonth > 11 ? 0 : nextMonth;
  }
  const lockDate = new Date(lockYear, lockMonth, INVOICE_EDIT_START_DAY, 0, 0, 0, 0);
  return now < lockDate;
}

export class InvoiceService {
  constructor({ storage, commandBus, eventBus, logger, sharedState }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.store = { items: [], setItems: (items) => { this.store.items = items; } };
  }

  generateInvoiceNumber(dateValue) {
    const safeDate = String(dateValue || '').trim() || new Date().toISOString().split('T')[0];
    const fyLabel = getFinancialYearLabel(safeDate);

    const allInvoices = this.store.items || [];
    const matchingInvoices = allInvoices.filter(inv => {
      const invDate = inv.date || inv.invoiceDate;
      return getFinancialYearLabel(invDate) === fyLabel;
    });

    let nextNumber = 1;
    matchingInvoices.forEach(inv => {
      const num = inv.invoiceNumber || '';
      const match = String(num).match(/(\d+)(?!.*\d)/);
      if (match) {
        nextNumber = Math.max(nextNumber, parseInt(match[1], 10) + 1);
      }
    });

    return `${fyLabel}/${String(nextNumber).padStart(4, '0')}`;
  }

  computeTotals(lines, roundOff = true) {
    const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const taxAmount = lines.reduce((sum, l) => sum + (l.total - l.subtotal), 0);
    const discountAmount = lines.reduce((sum, l) => sum + l.discount, 0);
    const rawTotal = subtotal + taxAmount - discountAmount;
    const roundOffAmount = roundOff ? Math.round(rawTotal) - rawTotal : 0;
    const totalAmount = rawTotal + roundOffAmount;
    return { subtotal, taxAmount, discountAmount, roundOffAmount, totalAmount };
  }

  async create(data) {
    this.logger.info('Creating invoice', data.invoiceNumber);
    const lines = data.lines.map(l => createLineItem(l));
    const totals = this.computeTotals(lines, data.roundOff !== false);
    const invoiceDate = data.date || new Date().toISOString().split('T')[0];
    const invoiceNumber = data.invoiceNumber || this.generateInvoiceNumber(invoiceDate);

    const invoice = createInvoice({
      ...data,
      id: crypto.randomUUID(),
      invoiceNumber,
      date: invoiceDate,
      lines,
      ...totals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({
      type: 'insert',
      table: 'invoices',
      values: {
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        customer_id: invoice.customerId,
        customer_name: invoice.customerName || null,
        company_id: invoice.companyId || null,
        date: invoice.date,
        due_date: invoice.dueDate || null,
        quotation_id: invoice.quotationId || null,
        po_number: invoice.poNumber || null,
        po_date: invoice.poDate || null,
        shipping_address: invoice.shippingAddress || null,
        round_off: invoice.roundOff ? 1 : 0,
        round_off_amount: invoice.roundOffAmount || 0,
        subtotal: invoice.subtotal,
        tax_amount: invoice.taxAmount,
        discount_amount: invoice.discountAmount,
        total_amount: invoice.totalAmount,
        status: invoice.status,
        notes: invoice.notes || null,
        terms: invoice.terms || null,
        einvoice_enabled: invoice.einvoiceEnabled ? 1 : 0,
        einvoice_status: invoice.einvoiceStatus || null,
        created_at: invoice.createdAt,
        updated_at: invoice.updatedAt,
      },
    });

    for (const line of lines) {
      await this.storage.runQuery({
        type: 'insert',
        table: 'invoice_lines',
        values: {
          id: line.id,
          invoice_id: invoice.id,
          item_id: line.itemId,
          item_name: line.itemName || null,
          description: line.description || null,
          hsn_sac: line.hsnSac || null,
          unit: line.unit || 'Nos',
          quantity: line.quantity,
          rate: line.rate,
          discount: line.discount,
          gst_rate: line.gstRate,
          subtotal: line.subtotal,
          total: line.total,
        },
      });
    }

    this.store.items.push(invoice);
    this.eventBus.emit('invoice:created', { invoice });
    return { success: true, data: invoice };
  }

  async update(id, data) {
    this.logger.info('Updating invoice', id);
    const existing = await this.findById(id);
    if (!existing) throw new InvoiceNotFoundError(id);
    if (existing.status === 'cancelled') throw new InvalidInvoiceStateError('Cannot update cancelled invoice');
    if (!canEditInvoiceRecord(existing)) {
      throw new InvalidInvoiceStateError('Invoice is locked and cannot be edited after the 10th of the following month');
    }

    const lines = data.lines.map(l => createLineItem(l));
    const totals = this.computeTotals(lines);
    const invoice = createInvoice({ ...existing, ...data, id, lines, ...totals, updatedAt: new Date().toISOString() });

    await this.storage.runQuery({
      type: 'update',
      table: 'invoices',
      where: { id },
      values: {
        invoice_number: invoice.invoiceNumber,
        customer_id: invoice.customerId,
        customer_name: invoice.customerName || null,
        company_id: invoice.companyId || null,
        date: invoice.date,
        due_date: invoice.dueDate || null,
        quotation_id: invoice.quotationId || null,
        subtotal: invoice.subtotal,
        tax_amount: invoice.taxAmount,
        discount_amount: invoice.discountAmount,
        total_amount: invoice.totalAmount,
        status: invoice.status,
        notes: invoice.notes || null,
        terms: invoice.terms || null,
        einvoice_enabled: invoice.einvoiceEnabled ? 1 : 0,
        einvoice_status: invoice.einvoiceStatus || null,
        updated_at: invoice.updatedAt,
      },
    });

    await this.storage.runQuery({ type: 'delete', table: 'invoice_lines', where: { invoice_id: id } });
    for (const line of lines) {
      await this.storage.runQuery({
        type: 'insert',
        table: 'invoice_lines',
        values: {
          id: line.id,
          invoice_id: invoice.id,
          item_id: line.itemId,
          item_name: line.itemName || null,
          quantity: line.quantity,
          rate: line.rate,
          discount: line.discount,
          gst_rate: line.gstRate,
          subtotal: line.subtotal,
          total: line.total,
        },
      });
    }

    this.store.items = this.store.items.map(inv => inv.id === id ? invoice : inv);
    this.eventBus.emit('invoice:updated', { invoice });
    return { success: true, data: invoice };
  }

  async delete(id) {
    this.logger.info('Deleting invoice', id);
    const existing = await this.findById(id);
    if (!existing) throw new InvoiceNotFoundError(id);
    await this.storage.runQuery({ type: 'delete', table: 'invoice_lines', where: { invoice_id: id } });
    await this.storage.runQuery({ type: 'delete', table: 'invoices', where: { id } });
    this.store.items = this.store.items.filter(inv => inv.id !== id);
    this.eventBus.emit('invoice:deleted', { id });
    return { success: true };
  }

  async cancel(id) {
    this.logger.info('Cancelling invoice', id);
    const existing = await this.findById(id);
    if (!existing) throw new InvoiceNotFoundError(id);
    if (existing.status === 'cancelled') return { success: true, data: existing };
    await this.storage.runQuery({ type: 'update', table: 'invoices', where: { id }, values: { status: 'cancelled', updated_at: new Date().toISOString() } });
    const invoice = { ...existing, status: 'cancelled', updatedAt: new Date().toISOString() };
    this.eventBus.emit('invoice:cancelled', { invoice });
    return { success: true, data: invoice };
  }

  async convertFromQuotation(quotationId) {
    this.logger.info('Converting quotation to invoice', quotationId);
    const qResult = await this.commandBus.invoke('quotation:getById', { id: quotationId });
    if (!qResult.success || !qResult.data) throw new QuotationNotFoundError(quotationId);
    const quotation = qResult.data;
    if (quotation.status !== 'final') throw new InvalidInvoiceStateError('Only final quotations can be converted');
    const lines = quotation.lines.map(l => ({ ...l, id: crypto.randomUUID() }));
    const totals = this.computeTotals(lines);
    const invoice = await this.create({
      quotationId,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      lines,
      ...totals,
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    return invoice;
  }

  async findById(id) {
    const result = await this.storage.runQuery({ table: 'invoices', where: { id }, limit: 1 });
    const row = result?.data?.[0];
    if (!row) return null;
    const linesResult = await this.storage.runQuery({ table: 'invoice_lines', where: { invoice_id: row.id } });
    const lines = (linesResult?.data || []).map(lr =>
      createLineItem({
        id: lr.id, itemId: lr.item_id, itemName: lr.item_name, description: lr.description,
        hsnSac: lr.hsn_sac, unit: lr.unit || 'Nos', quantity: lr.quantity, rate: lr.rate,
        discount: lr.discount, gstRate: lr.gst_rate, subtotal: lr.subtotal, total: lr.total,
      })
    );
    return createInvoice({
      id: row.id, invoiceNumber: row.invoice_number, customerId: row.customer_id,
      customerName: row.customer_name || undefined, companyId: row.company_id || undefined,
      date: row.date, dueDate: row.due_date || undefined, quotationId: row.quotation_id || undefined,
      poNumber: row.po_number || undefined, poDate: row.po_date || undefined,
      shippingAddress: row.shipping_address || undefined,
      customerPurchaseOrderId: row.customer_purchase_order_id || undefined,
      roundOff: row.round_off === 1, lines, subtotal: row.subtotal, taxAmount: row.tax_amount,
      discountAmount: row.discount_amount, roundOffAmount: row.round_off_amount || 0,
      totalAmount: row.total_amount, status: row.status, notes: row.notes || undefined,
      terms: row.terms || undefined, einvoiceEnabled: row.einvoice_enabled === 1,
      einvoiceStatus: row.einvoice_status || undefined, createdAt: row.created_at, updatedAt: row.updated_at,
    });
  }

  async getList(params = {}) {
    const { search, status, customerId, limit = 50, offset = 0 } = params;
    let sql = 'SELECT * FROM invoices WHERE 1=1';
    const whereValues = [];
    if (search) { sql += ' AND (invoice_number LIKE ? OR customer_name LIKE ?)'; whereValues.push(`%${search}%`, `%${search}%`); }
    if (status && status !== 'all') { sql += ' AND status = ?'; whereValues.push(status); }
    if (customerId) { sql += ' AND customer_id = ?'; whereValues.push(customerId); }
    sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    whereValues.push(limit, offset);
    const rows = await this.storage.runQuery({ type: 'custom', table: 'invoices', sql, values: whereValues });
    return {
      success: true,
      data: (rows?.data || []).map(row => ({
        id: row.id, invoiceNumber: row.invoice_number, customerId: row.customer_id,
        customerName: row.customer_name || undefined, companyId: row.company_id || undefined,
        date: row.date, dueDate: row.due_date || undefined, quotationId: row.quotation_id || undefined,
        poNumber: row.po_number || undefined, poDate: row.po_date || undefined,
        shippingAddress: row.shipping_address || undefined,
        customerPurchaseOrderId: row.customer_purchase_order_id || undefined,
        roundOff: row.round_off === 1, subtotal: row.subtotal, taxAmount: row.tax_amount,
        discountAmount: row.discount_amount, roundOffAmount: row.round_off_amount || 0,
        totalAmount: row.total_amount, status: row.status, notes: row.notes || undefined,
        terms: row.terms || undefined, einvoiceEnabled: row.einvoice_enabled === 1,
        einvoiceStatus: row.einvoice_status || undefined, createdAt: row.created_at, updatedAt: row.updated_at,
      })),
    };
  }

  canEdit(invoice) {
    return canEditInvoiceRecord(invoice);
  }
}
