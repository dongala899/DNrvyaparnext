import { createPurchase, createPurchaseLine, getCompanyId } from '../domain/entities.js';
import { PurchaseNotFoundError } from '../domain/errors.js';

export class PurchaseService {
  constructor({ storage, commandBus, eventBus, logger, sharedState }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.store = { items: [], setItems: (items) => { this.store.items = items; } };
  }

  companyId() {
    return getCompanyId(this.sharedState);
  }

  computeTotals(lines) {
    const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const taxAmount = lines.reduce((sum, l) => sum + (l.subtotal * l.taxRate / 100), 0);
    const discountAmount = lines.reduce((sum, l) => sum + l.discount, 0);
    return { subtotal, taxAmount, discountAmount, totalAmount: subtotal + taxAmount - discountAmount };
  }

  async create(data) {
    this.logger.info('Creating purchase', data.billNumber);
    const lines = data.lines.map(l => createPurchaseLine(l));
    const totals = this.computeTotals(lines);
    const purchase = createPurchase({ ...data, id: crypto.randomUUID(), companyId: this.companyId(), date: data.date || new Date().toISOString(), lines, status: data.status || 'draft', ...totals, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await this.storage.runQuery({ type: 'insert', table: 'purchases', values: { id: purchase.id, company_id: purchase.companyId, bill_number: purchase.billNumber, vendor_id: purchase.vendorId, vendor_name: purchase.vendorName || null, grn_id: purchase.grnId || null, po_id: purchase.poId || null, date: purchase.date, due_date: purchase.dueDate || null, subtotal: purchase.subtotal, tax_amount: purchase.taxAmount, discount_amount: purchase.discountAmount, total_amount: purchase.totalAmount, status: purchase.status, notes: purchase.notes || null, created_at: purchase.createdAt, updated_at: purchase.updatedAt }});
    for (const line of lines) {
      await this.storage.runQuery({ type: 'insert', table: 'purchase_lines', values: { id: line.id, purchase_id: purchase.id, item_id: line.itemId, item_name: line.itemName || null, quantity: line.quantity, rate: line.rate, discount: line.discount, tax_rate: line.taxRate, subtotal: line.subtotal, total: line.total, input_tax_credit: line.inputTaxCredit ? 1 : 0 }});
    }
    this.eventBus.emit('purchase:created', { purchase });
    return { success: true, data: purchase };
  }

  async update(id, data) {
    this.logger.info('Updating purchase', id);
    const existing = await this.findById(id);
    if (!existing) throw new PurchaseNotFoundError(id);
    const lines = data.lines.map(l => createPurchaseLine(l));
    const totals = this.computeTotals(lines);
    const purchase = createPurchase({ ...existing, ...data, id, lines, ...totals, updatedAt: new Date().toISOString() });
    await this.storage.runQuery({ type: 'update', table: 'purchases', where: { id }, values: { bill_number: purchase.billNumber, vendor_id: purchase.vendorId, vendor_name: purchase.vendorName || null, grn_id: purchase.grnId || null, po_id: purchase.poId || null, date: purchase.date, due_date: purchase.dueDate || null, subtotal: purchase.subtotal, tax_amount: purchase.taxAmount, discount_amount: purchase.discountAmount, total_amount: purchase.totalAmount, status: purchase.status, notes: purchase.notes || null, updated_at: purchase.updatedAt }});
    await this.storage.runQuery({ type: 'delete', table: 'purchase_lines', where: { purchase_id: id } });
    for (const line of lines) { await this.storage.runQuery({ type: 'insert', table: 'purchase_lines', values: { id: line.id, purchase_id: purchase.id, item_id: line.itemId, item_name: line.itemName || null, quantity: line.quantity, rate: line.rate, discount: line.discount, tax_rate: line.taxRate, subtotal: line.subtotal, total: line.total, input_tax_credit: line.inputTaxCredit ? 1 : 0 }}); }
    this.eventBus.emit('purchase:updated', { purchase });
    return { success: true, data: purchase };
  }

  async delete(id) {
    this.logger.info('Deleting purchase', id);
    const existing = await this.findById(id);
    if (!existing) throw new PurchaseNotFoundError(id);
    await this.storage.runQuery({ type: 'delete', table: 'purchase_lines', where: { purchase_id: id } });
    const cid = this.companyId();
    await this.storage.runQuery({ type: 'delete', table: 'purchases', where: cid ? { id, company_id: cid } : { id } });
    this.eventBus.emit('purchase:deleted', { id });
    return { success: true };
  }

  async findById(id) {
    const cid = this.companyId();
    const result = await this.storage.runQuery({ table: 'purchases', where: cid ? { id, company_id: cid } : { id }, limit: 1 });
    const row = result?.data?.[0];
    if (!row) return null;
    const linesResult = await this.storage.runQuery({ table: 'purchase_lines', where: { purchase_id: row.id } });
    const lines = (linesResult?.data || []).map(lr => createPurchaseLine({ id: lr.id, itemId: lr.item_id, itemName: lr.item_name, quantity: lr.quantity, rate: lr.rate, discount: lr.discount, taxRate: lr.tax_rate, subtotal: lr.subtotal, total: lr.total, inputTaxCredit: lr.input_tax_credit === 1 }));
    return createPurchase({ id: row.id, companyId: row.company_id, billNumber: row.bill_number, vendorId: row.vendor_id, vendorName: row.vendor_name || undefined, grnId: row.grn_id || undefined, poId: row.po_id || undefined, date: row.date, dueDate: row.due_date || undefined, lines, subtotal: row.subtotal, taxAmount: row.tax_amount, discountAmount: row.discount_amount, totalAmount: row.total_amount, status: row.status, notes: row.notes || undefined, createdAt: row.created_at, updatedAt: row.updated_at });
  }

  async getList(params = {}) {
    const { search, status, limit = 50, offset = 0 } = params;
    const cid = this.companyId();
    let sql = 'SELECT * FROM purchases';
    const whereValues = [];
    const whereClauses = [];
    if (cid) whereClauses.push('company_id = ?'), whereValues.push(cid);
    if (search) whereClauses.push('(bill_number LIKE ? OR vendor_name LIKE ?)'), whereValues.push(`%${search}%`, `%${search}%`);
    if (status && status !== 'all') whereClauses.push('status = ?'), whereValues.push(status);
    if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');
    sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    whereValues.push(limit, offset);
    const rows = await this.storage.runQuery({ type: 'custom', table: 'purchases', sql, values: whereValues });
    return { success: true, data: (rows?.data || []).map(row => ({ id: row.id, companyId: row.company_id, billNumber: row.bill_number, vendorId: row.vendor_id, vendorName: row.vendor_name || undefined, grnId: row.grn_id || undefined, poId: row.po_id || undefined, date: row.date, dueDate: row.due_date || undefined, subtotal: row.subtotal, taxAmount: row.tax_amount, discountAmount: row.discount_amount, totalAmount: row.total_amount, status: row.status, notes: row.notes || undefined, createdAt: row.created_at, updatedAt: row.updated_at })) };
  }

  async createFromGrn(grnId) {
    const grn = await this.commandBus.invoke('grn:getById', { id: grnId });
    if (!grn.success || !grn.data) throw new Error('GRN not found');
    const lines = grn.data.lines.map(l => ({ ...l, id: crypto.randomUUID(), itemName: l.itemName || l.itemId, inputTaxCredit: true }));
    const totals = this.computeTotals(lines);
    return this.create({ vendorId: grn.data.vendorId || '', grnId, lines, ...totals, billNumber: `PB/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`, date: new Date().toISOString(), status: 'draft' });
  }

  async createVendorPayment(data) {
    this.logger.info('Creating vendor payment', data.vendorId);
    const cid = this.companyId();
    const payment = { id: crypto.randomUUID(), ...data, paymentDate: data.paymentDate || new Date().toISOString(), createdAt: new Date().toISOString() };
    await this.storage.runQuery({ type: 'insert', table: 'vendor_payments', values: { id: payment.id, company_id: cid, vendor_id: payment.vendorId, amount: payment.amount, payment_date: payment.paymentDate, payment_mode: payment.paymentMode, reference_number: payment.referenceNumber || null, notes: payment.notes || null, created_at: payment.createdAt }});
    this.eventBus.emit('vendorPayment:created', { payment });
    return { success: true, data: payment };
  }

  async getVendorPayments(params = {}) {
    const { vendorId, limit = 50, offset = 0 } = params;
    const cid = this.companyId();
    let sql = 'SELECT * FROM vendor_payments';
    const whereValues = [];
    const whereClauses = [];
    if (cid) whereClauses.push('company_id = ?'), whereValues.push(cid);
    if (vendorId) whereClauses.push('vendor_id = ?'), whereValues.push(vendorId);
    if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');
    sql += ' ORDER BY payment_date DESC LIMIT ? OFFSET ?';
    whereValues.push(limit, offset);
    if (vendorId) { sql += ' AND vendor_id = ?'; whereValues.push(vendorId); }
    sql += ' ORDER BY payment_date DESC LIMIT ? OFFSET ?';
    whereValues.push(limit, offset);
    const rows = await this.storage.runQuery({ type: 'custom', table: 'vendor_payments', sql, values: whereValues });
    return { success: true, data: (rows?.data || []).map(row => ({ id: row.id, companyId: row.company_id, vendorId: row.vendor_id, amount: row.amount, paymentDate: row.payment_date, paymentMode: row.payment_mode, referenceNumber: row.reference_number || undefined, notes: row.notes || undefined })) };
  }
}
