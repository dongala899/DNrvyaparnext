import { createPayment, getCompanyId } from '../domain/entities.js';
import { PaymentNotFoundError, OverpaymentError, InvalidPaymentStatusError } from '../domain/errors.js';

export class PaymentService {
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

  async create(data) {
    this.logger.info('Creating payment', data.invoiceId);
    
    const invoice = await this.commandBus.invoke('invoice:getById', { id: data.invoiceId });
    if (!invoice.success || !invoice.data) {
      throw new PaymentNotFoundError(data.invoiceId);
    }
    
    const inv = invoice.data;
    const payments = await this.getList({ invoiceId: data.invoiceId });
    const paidAlready = (payments.data || []).reduce((s, p) => s + p.amount, 0);
    const dueAmount = inv.totalAmount - paidAlready;
    
    if (data.amount > dueAmount) {
      throw new OverpaymentError(data.amount, dueAmount);
    }

    const payment = createPayment({
      ...data,
      id: crypto.randomUUID(),
      companyId: this.companyId(),
      paymentDate: data.paymentDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    await this.storage.runQuery({ type: 'insert', table: 'payments', values: {
      id: payment.id,
      company_id: payment.companyId,
      invoice_id: payment.invoiceId,
      customer_id: payment.customerId,
      amount: payment.amount,
      payment_date: payment.paymentDate,
      payment_mode: payment.paymentMode,
      reference_number: payment.referenceNumber || null,
      notes: payment.notes || null,
      status: payment.status,
      created_at: payment.createdAt,
    }});

    this.eventBus.emit('payment:created', { payment });
    await this.updateInvoiceStatus(data.invoiceId);
    return { success: true, data: payment };
  }

  async update(id, data) {
    this.logger.info('Updating payment', id);
    const existing = await this.findById(id);
    if (!existing) throw new PaymentNotFoundError(id);
    
    const payment = createPayment({ ...existing, ...data, id });
    await this.storage.runQuery({ type: 'update', table: 'payments', where: { id }, values: {
      invoice_id: payment.invoiceId, customer_id: payment.customerId, amount: payment.amount,
      payment_date: payment.paymentDate, payment_mode: payment.paymentMode,
      reference_number: payment.referenceNumber || null, notes: payment.notes || null, status: payment.status,
    }});
    this.eventBus.emit('payment:updated', { payment });
    return { success: true, data: payment };
  }

  async delete(id) {
    this.logger.info('Deleting payment', id);
    const existing = await this.findById(id);
    if (!existing) throw new PaymentNotFoundError(id);
    const cid = this.companyId();
    await this.storage.runQuery({ type: 'delete', table: 'payments', where: cid ? { id, company_id: cid } : { id } });
    this.eventBus.emit('payment:deleted', { id });
    return { success: true };
  }

  async findById(id) {
    const cid = this.companyId();
    const result = await this.storage.runQuery({ table: 'payments', where: cid ? { id, company_id: cid } : { id }, limit: 1 });
    const row = result?.data?.[0];
    if (!row) return null;
    return createPayment({
      id: row.id, companyId: row.company_id, invoiceId: row.invoice_id, customerId: row.customer_id,
      amount: row.amount, paymentDate: row.payment_date, paymentMode: row.payment_mode,
      referenceNumber: row.reference_number || undefined, notes: row.notes || undefined,
      status: row.status, createdAt: row.created_at,
    });
  }

  async getList(params = {}) {
    const { invoiceId, customerId, status, limit = 50, offset = 0 } = params;
    const cid = this.companyId();
    const whereValues = [];
    let sql = 'SELECT * FROM payments';
    const whereClauses = [];
    if (cid) whereClauses.push('company_id = ?'), whereValues.push(cid);
    if (invoiceId) whereClauses.push('invoice_id = ?'), whereValues.push(invoiceId);
    if (customerId) whereClauses.push('customer_id = ?'), whereValues.push(customerId);
    if (status) whereClauses.push('status = ?'), whereValues.push(status);
    if (whereClauses.length > 0) sql += ' WHERE ' + whereClauses.join(' AND ');
    sql += ' ORDER BY payment_date DESC LIMIT ? OFFSET ?';
    whereValues.push(limit, offset);
    const rows = await this.storage.runQuery({ type: 'custom', table: 'payments', sql, values: whereValues });
    return { success: true, data: (rows?.data || []).map(row => createPayment({ id: row.id, companyId: row.company_id, invoiceId: row.invoice_id, customerId: row.customer_id, amount: row.amount, paymentDate: row.payment_date, paymentMode: row.payment_mode, referenceNumber: row.reference_number || undefined, notes: row.notes || undefined, status: row.status, createdAt: row.created_at })) };
  }

  async updateInvoiceStatus(invoiceId) {
    const payments = await this.getList({ invoiceId });
    const paidAmount = (payments?.data || []).reduce((s, p) => s + p.amount, 0);
    const invResult = await this.commandBus.invoke('invoice:getById', { id: invoiceId });
    if (invResult.success && invResult.data) {
      const inv = invResult.data;
      const newStatus = paidAmount >= inv.totalAmount ? 'confirmed' : (paidAmount > 0 ? 'partial' : inv.status);
      await this.commandBus.invoke('invoice:update', { id: invoiceId, data: { ...inv, status: newStatus === inv.status ? inv.status : newStatus } });
    }
  }
}
