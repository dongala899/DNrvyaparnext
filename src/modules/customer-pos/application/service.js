import { createCartLine, createPosState } from '../domain/entities.js';

export class PosService {
  constructor({ storage, commandBus, eventBus, logger, sharedState }) {
    this.storage = storage;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sharedState = sharedState;
    this.cart = createPosState({});
  }

  getCart() { return this.cart; }

  addLine(itemId, quantity, rate, discount = 0, gstRate = 18) {
    const existing = this.cart.lines.find(l => l.itemId === itemId);
    if (existing) {
      existing.quantity += quantity;
      existing.rate = rate;
      existing.discount = discount;
      existing.gstRate = gstRate;
    } else {
      this.cart.lines.push(createCartLine({ id: crypto.randomUUID(), itemId, quantity, rate, discount, gstRate }));
    }
    this.updateTotals();
    this.eventBus.emit('pos:cartUpdated', { cart: this.cart });
    return this.cart;
  }

  updateLine(lineId, updates) {
    const line = this.cart.lines.find(l => l.id === lineId);
    if (!line) return this.cart;
    Object.assign(line, updates);
    this.updateTotals();
    this.eventBus.emit('pos:cartUpdated', { cart: this.cart });
    return this.cart;
  }

  removeLine(lineId) {
    this.cart.lines = this.cart.lines.filter(l => l.id !== lineId);
    this.updateTotals();
    this.eventBus.emit('pos:cartUpdated', { cart: this.cart });
    return this.cart;
  }

  resetCart() {
    this.cart = createPosState({ customerId: this.cart.customerId, customerName: this.cart.customerName });
    this.eventBus.emit('pos:cartReset', { cart: this.cart });
    return this.cart;
  }

  setCustomer(customerId, customerName) {
    this.cart.customerId = customerId;
    this.cart.customerName = customerName;
    this.eventBus.emit('pos:cartUpdated', { cart: this.cart });
    return this.cart;
  }

  setNotes(notes) {
    this.cart.notes = notes;
    this.eventBus.emit('pos:cartUpdated', { cart: this.cart });
    return this.cart;
  }

  updateTotals() {
    this.cart.lines.forEach(line => {
      line.subtotal = line.quantity * line.rate;
      const tax = line.subtotal * (line.gstRate / 100);
      line.total = line.subtotal + tax - line.discount;
    });
  }

  computeTotals() {
    const subtotal = this.cart.lines.reduce((s, l) => s + l.subtotal, 0);
    const taxAmount = this.cart.lines.reduce((s, l) => s + (l.subtotal * l.gstRate / 100), 0);
    const discountAmount = this.cart.lines.reduce((s, l) => s + l.discount, 0);
    return { subtotal, taxAmount, discountAmount, totalAmount: subtotal + taxAmount - discountAmount };
  }

  async createInvoiceFromCart() {
    if (this.cart.lines.length === 0) {
      throw new Error('Cart is empty');
    }
    const totals = this.computeTotals();
    const invoiceData = {
      invoiceNumber: '',
      customerId: this.cart.customerId || undefined,
      customerName: this.cart.customerName || undefined,
      lines: this.cart.lines.map(l => ({ ...l })),
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      status: 'draft',
      notes: this.cart.notes || undefined,
    };
    const result = await this.commandBus.invoke('invoice:create', invoiceData);
    if (result.success) {
      this.resetCart();
      this.eventBus.emit('pos:invoiceCreated', { invoice: result.data });
    }
    return result;
  }
}