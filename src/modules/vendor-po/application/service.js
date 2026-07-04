import { createPurchaseOrder, createGrn, createPoLine } from '../domain/entities.js';
import { PoNotFoundError, GrnNotFoundError, InsufficientQuantityError } from '../domain/errors.js';

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

export class VendorPoService {
  constructor({ storage, commandBus, eventBus, logger, sharedState }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.store = { items: [], setItems: (items) => { this.store.items = items; } };
  }

  generatePoNumber(dateValue) {
    const safeDate = String(dateValue || '').trim() || new Date().toISOString().split('T')[0];
    const fyLabel = getFinancialYearLabel(safeDate);

    const allPos = this.store.items || [];
    const matching = allPos.filter(po => getFinancialYearLabel(po.date) === fyLabel);

    let nextNumber = 1;
    matching.forEach(po => {
      const num = po.poNumber || '';
      const parts = String(num).split('/');
      if (parts.length === 3 && parts[0] === 'PO' && parts[1] === fyLabel) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > nextNumber) nextNumber = seq;
      }
    });
    nextNumber += 1;

    return `PO/${fyLabel}/${String(nextNumber).padStart(4, '0')}`;
  }

  computeTotals(lines) {
    const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const taxAmount = lines.reduce((sum, l) => sum + (l.subtotal * l.taxRate / 100), 0);
    const discountAmount = lines.reduce((sum, l) => sum + l.discount, 0);
    return { subtotal, taxAmount, discountAmount, totalAmount: subtotal + taxAmount - discountAmount };
  }

  async create(data) {
    this.logger.info('Creating PO', data.poNumber);
    const lines = data.lines.map(l => createPoLine(l));
    const totals = this.computeTotals(lines);
    const po = createPurchaseOrder({ ...data, id: crypto.randomUUID(), poNumber: data.poNumber || this.generatePoNumber(data.date), date: data.date || new Date().toISOString(), lines, ...totals, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await this.storage.runQuery({ type: 'insert', table: 'purchase_orders', values: { id: po.id, po_number: po.poNumber, vendor_id: po.vendorId, vendor_name: po.vendorName || null, date: po.date, expected_date: po.expectedDate || null, subtotal: po.subtotal, tax_amount: po.taxAmount, discount_amount: po.discountAmount, total_amount: po.totalAmount, status: po.status, notes: po.notes || null, created_at: po.createdAt, updated_at: po.updatedAt }});
    for (const line of lines) {
      await this.storage.runQuery({ type: 'insert', table: 'po_lines', values: { id: line.id, po_id: po.id, item_id: line.itemId, item_name: line.itemName || null, quantity: line.quantity, received_quantity: 0, rate: line.rate, discount: line.discount, tax_rate: line.taxRate, subtotal: line.subtotal, total: line.total }});
    }
    this.eventBus.emit('po:created', { po });
    return { success: true, data: po };
  }

  async update(id, data) {
    this.logger.info('Updating PO', id);
    const existing = await this.findById(id);
    if (!existing) throw new PoNotFoundError(id);
    const lines = data.lines.map(l => createPoLine(l));
    const totals = this.computeTotals(lines);
    const po = createPurchaseOrder({ ...existing, ...data, id, lines, ...totals, updatedAt: new Date().toISOString() });
    await this.storage.runQuery({ type: 'update', table: 'purchase_orders', where: { id }, values: { po_number: po.poNumber, vendor_id: po.vendorId, vendor_name: po.vendorName || null, date: po.date, expected_date: po.expectedDate || null, subtotal: po.subtotal, tax_amount: po.taxAmount, discount_amount: po.discountAmount, total_amount: po.totalAmount, status: po.status, notes: po.notes || null, updated_at: po.updatedAt }});
    await this.storage.runQuery({ type: 'delete', table: 'po_lines', where: { po_id: id } });
    for (const line of lines) { await this.storage.runQuery({ type: 'insert', table: 'po_lines', values: { id: line.id, po_id: po.id, item_id: line.itemId, item_name: line.itemName || null, quantity: line.quantity, received_quantity: 0, rate: line.rate, discount: line.discount, tax_rate: line.taxRate, subtotal: line.subtotal, total: line.total }}); }
    this.eventBus.emit('po:updated', { po });
    return { success: true, data: po };
  }

  async delete(id) {
    this.logger.info('Deleting PO', id);
    const existing = await this.findById(id);
    if (!existing) throw new PoNotFoundError(id);
    await this.storage.runQuery({ type: 'delete', table: 'po_lines', where: { po_id: id } });
    await this.storage.runQuery({ type: 'delete', table: 'purchase_orders', where: { id } });
    this.eventBus.emit('po:deleted', { id });
    return { success: true };
  }

  async findById(id) {
    const result = await this.storage.runQuery({ table: 'purchase_orders', where: { id }, limit: 1 });
    const row = result?.data?.[0];
    if (!row) return null;
    const linesResult = await this.storage.runQuery({ table: 'po_lines', where: { po_id: row.id } });
    const lines = (linesResult?.data || []).map(lr => createPoLine({ id: lr.id, itemId: lr.item_id, itemName: lr.item_name, quantity: lr.quantity, receivedQuantity: lr.received_quantity, rate: lr.rate, discount: lr.discount, taxRate: lr.tax_rate, subtotal: lr.subtotal, total: lr.total }));
    return createPurchaseOrder({ id: row.id, poNumber: row.po_number, vendorId: row.vendor_id, vendorName: row.vendor_name || undefined, date: row.date, expectedDate: row.expected_date || undefined, lines, subtotal: row.subtotal, taxAmount: row.tax_amount, discountAmount: row.discount_amount, totalAmount: row.total_amount, status: row.status, notes: row.notes || undefined, createdAt: row.created_at, updatedAt: row.updated_at });
  }

  async getList(params = {}) {
    const { search, status, limit = 50, offset = 0 } = params;
    let sql = 'SELECT * FROM purchase_orders WHERE 1=1';
    const whereValues = [];
    if (search) { sql += ' AND (po_number LIKE ? OR vendor_name LIKE ?)'; whereValues.push(`%${search}%`, `%${search}%`); }
    if (status && status !== 'all') { sql += ' AND status = ?'; whereValues.push(status); }
    sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    whereValues.push(limit, offset);
    const rows = await this.storage.runQuery({ type: 'custom', table: 'purchase_orders', sql, values: whereValues });
    return { success: true, data: (rows?.data || []).map(row => ({ id: row.id, poNumber: row.po_number, vendorId: row.vendor_id, vendorName: row.vendor_name || undefined, date: row.date, expectedDate: row.expected_date || undefined, subtotal: row.subtotal, taxAmount: row.tax_amount, discountAmount: row.discount_amount, totalAmount: row.total_amount, status: row.status, notes: row.notes || undefined, createdAt: row.created_at, updatedAt: row.updated_at })) };
  }

  async createGrn(poId, data) {
    this.logger.info('Creating GRN', { poId });
    const po = await this.findById(poId);
    if (!po) throw new PoNotFoundError(poId);

    for (const line of data.lines) {
      const poLine = po.lines.find(l => l.id === line.poLineId);
      if (!poLine) throw new Error(`PO line ${line.poLineId} not found`);
      const newReceived = poLine.receivedQuantity + line.quantity;
      if (newReceived > poLine.quantity) throw new InsufficientQuantityError(line.itemId, poLine.quantity, newReceived);
      await this.storage.runQuery({ type: 'update', table: 'po_lines', where: { id: poLine.id }, values: { received_quantity: newReceived } });
    }

    const grn = createGrn({ id: crypto.randomUUID(), grnNumber: `GRN/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`, poId, date: new Date().toISOString(), lines: data.lines, notes: data.notes });
    await this.storage.runQuery({ type: 'insert', table: 'grns', values: { id: grn.id, grn_number: grn.grnNumber, po_id: grn.poId, date: grn.date, notes: grn.notes || null, created_at: grn.createdAt }});
    for (const line of data.lines) {
      await this.storage.runQuery({ type: 'insert', table: 'grn_lines', values: { id: crypto.randomUUID(), grn_id: grn.id, po_line_id: line.poLineId, item_id: line.itemId, quantity: line.quantity, rate: line.rate }});
    }

    const allReceived = po.lines.every(l => l.receivedQuantity >= l.quantity);
    if (allReceived && po.status === 'issued') {
      await this.storage.runQuery({ type: 'update', table: 'purchase_orders', where: { id: poId }, values: { status: 'closed', updated_at: new Date().toISOString() }});
    }

    this.eventBus.emit('grn:created', { grn });
    return { success: true, data: grn };
  }

  async getGrnList(params = {}) {
    const { poId, limit = 50, offset = 0 } = params;
    let sql = 'SELECT * FROM grns WHERE 1=1';
    const whereValues = [];
    if (poId) { sql += ' AND po_id = ?'; whereValues.push(poId); }
    sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    whereValues.push(limit, offset);
    const rows = await this.storage.runQuery({ type: 'custom', table: 'grns', sql, values: whereValues });
    return { success: true, data: (rows?.data || []).map(row => ({ id: row.id, grnNumber: row.grn_number, poId: row.po_id, date: row.date, notes: row.notes || undefined })) };
  }

  async getGrnById(id) {
    const result = await this.storage.runQuery({ table: 'grns', where: { id }, limit: 1 });
    const row = result?.data?.[0];
    if (!row) throw new GrnNotFoundError(id);
    const linesResult = await this.storage.runQuery({ table: 'grn_lines', where: { grn_id: row.id } });
    return { id: row.id, grnNumber: row.grn_number, poId: row.po_id, date: row.date, lines: (linesResult?.data || []).map(lr => ({ ...lr })), notes: row.notes || undefined };
  }
}