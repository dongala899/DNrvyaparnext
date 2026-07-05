import { createCustomerOrder, createOrderLine, getCompanyId } from '../domain/entities.js';
import { CustomerOrderNotFoundError, CustomerOrderConversionError } from '../domain/errors.js';

export class CustomerOrderService {
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

  generateOrderNumber() {
    const now = new Date();
    const fy = this.getFinancialYear(now);
    const prefix = 'CO';
    const existing = this.store.items.filter(o => o.orderNumber?.startsWith(`${prefix}/${fy}`));
    const maxSeq = existing.reduce((max, o) => {
      const parts = (o.orderNumber || '').split('/');
      if (parts.length === 3 && parts[0] === prefix && parts[1] === fy) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > max) return seq;
      }
      return max;
    }, 0);
    return `${prefix}/${fy}/${String(maxSeq + 1).padStart(4, '0')}`;
  }

  getFinancialYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const fyStart = month >= 4 ? year : year - 1;
    const fyEnd = fyStart + 1;
    return `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`;
  }

  async create(data) {
    this.logger.info('Creating customer order', data.orderNumber);

    const orderNumber = data.orderNumber || this.generateOrderNumber();
    const order = createCustomerOrder({
      ...data,
      id: crypto.randomUUID(),
      companyId: this.companyId(),
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({
      type: 'insert',
      table: 'customer_orders',
      values: this.toDbRow(order),
    });

    for (const line of order.lines) {
      await this.storage.runQuery({
        type: 'insert',
        table: 'customer_order_lines',
        values: {
          id: line.id,
          order_id: order.id,
          item_id: line.itemId,
          item_name: line.itemName || null,
          description: line.description || null,
          quantity: line.quantity,
          unit: line.unit,
          rate: line.rate,
          discount: line.discount,
          discount_type: line.discountType,
          gst_rate: line.gstRate,
          subtotal: line.subtotal,
          tax_amount: line.taxAmount,
          total: line.total,
        },
      });
    }

    this.store.items.push(order);
    this.eventBus.emit('customerOrder:created', { order });
    return { success: true, data: order };
  }

  async update(id, data) {
    this.logger.info('Updating customer order', id);
    const existing = await this.findById(id);
    if (!existing) throw new CustomerOrderNotFoundError(id);

    if (existing.status === 'converted') {
      throw new CustomerOrderConversionError('Cannot update an order that has been converted to invoice');
    }

    const updated = createCustomerOrder({
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });

    await this.storage.runQuery({
      type: 'update',
      table: 'customer_orders',
      where: { id, company_id: this.companyId() },
      values: this.toDbRow(updated),
    });

    await this.storage.runQuery({ type: 'delete', table: 'customer_order_lines', where: { order_id: id } });
    for (const line of updated.lines) {
      await this.storage.runQuery({
        type: 'insert',
        table: 'customer_order_lines',
        values: {
          id: line.id,
          order_id: id,
          item_id: line.itemId,
          item_name: line.itemName || null,
          description: line.description || null,
          quantity: line.quantity,
          unit: line.unit,
          rate: line.rate,
          discount: line.discount,
          discount_type: line.discountType,
          gst_rate: line.gstRate,
          subtotal: line.subtotal,
          tax_amount: line.taxAmount,
          total: line.total,
        },
      });
    }

    this.store.items = this.store.items.map(o => o.id === id ? updated : o);
    this.eventBus.emit('customerOrder:updated', { order: updated });
    return { success: true, data: updated };
  }

  async findById(id) {
    const cid = this.companyId();
    const result = await this.storage.runQuery({
      table: 'customer_orders',
      where: cid ? { id, company_id: cid } : { id },
      limit: 1,
    });
    const row = result?.data?.[0];
    if (!row) return null;

    const linesResult = await this.storage.runQuery({
      table: 'customer_order_lines',
      where: { order_id: id },
    });
    const lines = (linesResult?.data || []).map(lr => createOrderLine({
      id: lr.id,
      itemId: lr.item_id,
      itemName: lr.item_name || undefined,
      description: lr.description || undefined,
      quantity: lr.quantity,
      unit: lr.unit,
      rate: lr.rate,
      discount: lr.discount,
      discountType: lr.discount_type,
      gstRate: lr.gst_rate,
    }));

    return this.fromDbRow(row, lines);
  }

  async getList(params = {}) {
    const { status, customerId, search, limit = 50, offset = 0 } = params;
    const cid = this.companyId();
    let sql = 'SELECT * FROM customer_orders';
    const values = [];
    const whereClauses = [];

    if (cid) whereClauses.push('company_id = ?'), values.push(cid);
    if (status && status !== 'all') whereClauses.push('status = ?'), values.push(status);
    if (customerId) whereClauses.push('customer_id = ?'), values.push(customerId);
    if (search) whereClauses.push('(order_number LIKE ? OR customer_name LIKE ?)'), values.push(`%${search}%`, `%${search}%`);

    if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');
    sql += ' ORDER BY order_date DESC, created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const result = await this.storage.runQuery({ type: 'custom', table: 'customer_orders', sql, values });
    return { success: true, data: (result?.data || []).map(row => this.fromDbRow(row, [])) };
  }

  async delete(id) {
    const existing = await this.findById(id);
    if (!existing) throw new CustomerOrderNotFoundError(id);

    if (existing.status === 'converted') {
      throw new CustomerOrderConversionError('Cannot delete an order that has been converted to invoice');
    }

    await this.storage.runQuery({ type: 'delete', table: 'customer_order_lines', where: { order_id: id } });
    const cid = this.companyId();
    await this.storage.runQuery({ type: 'delete', table: 'customer_orders', where: cid ? { id, company_id: cid } : { id } });

    this.store.items = this.store.items.filter(o => o.id !== id);
    this.eventBus.emit('customerOrder:deleted', { id });
    return { success: true };
  }

  async convertToInvoice(id) {
    const order = await this.findById(id);
    if (!order) throw new CustomerOrderNotFoundError(id);
    if (order.status === 'converted') {
      throw new CustomerOrderConversionError('Order already converted');
    }

    const invoiceResult = await this.commandBus.invoke('invoice:create', {
      customerId: order.customerId,
      customerName: order.customerName,
      customerAddress: order.customerAddress,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerGstin: order.customerGstin,
      quotationId: order.id,
      lines: order.lines.map(l => ({
        itemId: l.itemId,
        itemName: l.itemName,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        rate: l.rate,
        discount: l.discount,
        discountType: l.discountType,
        gstRate: l.gstRate,
      })),
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      notes: `Converted from order ${order.orderNumber}`,
    });

    if (invoiceResult.success) {
      await this.update(id, { status: 'converted' });
      this.eventBus.emit('customerOrder:converted', { order, invoice: invoiceResult.data });
    }

    return invoiceResult;
  }

  toDbRow(order) {
    return {
      id: order.id,
      company_id: order.companyId,
      order_number: order.orderNumber,
      customer_id: order.customerId,
      customer_name: order.customerName || null,
      customer_address: order.customerAddress || null,
      customer_phone: order.customerPhone || null,
      customer_email: order.customerEmail || null,
      customer_gstin: order.customerGstin || null,
      order_date: order.orderDate,
      expected_date: order.expectedDate || null,
      delivery_address: order.deliveryAddress || null,
      reference: order.reference || null,
      notes: order.notes || null,
      terms: order.terms || null,
      status: order.status,
      subtotal: order.subtotal,
      tax_amount: order.taxAmount,
      discount_amount: order.discountAmount,
      round_off: order.roundOff,
      total_amount: order.totalAmount,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };
  }

  fromDbRow(row, lines) {
    return createCustomerOrder({
      id: row.id,
      companyId: row.company_id || undefined,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      customerName: row.customer_name || undefined,
      customerAddress: row.customer_address || undefined,
      customerPhone: row.customer_phone || undefined,
      customerEmail: row.customer_email || undefined,
      customerGstin: row.customer_gstin || undefined,
      orderDate: row.order_date,
      expectedDate: row.expected_date || undefined,
      deliveryAddress: row.delivery_address || undefined,
      reference: row.reference || undefined,
      notes: row.notes || undefined,
      terms: row.terms || undefined,
      status: row.status,
      lines: lines,
    });
  }
}
