import { describe, it, expect } from 'vitest';
import { InvoiceSchema, LineItemSchema, createInvoice, createLineItem } from '../../../src/modules/invoices/domain/entities.js';

describe('Invoices Domain Entities', () => {
  describe('LineItemSchema', () => {
    it('should validate a valid line item', () => {
      const line = createLineItem({ id: '1', itemId: 'item-1', quantity: 2, rate: 100, discount: 0, gstRate: 18, subtotal: 200, total: 236 });
      expect(line.quantity).toBe(2);
      expect(line.rate).toBe(100);
    });
  });

  describe('InvoiceSchema', () => {
    it('should validate a valid invoice', () => {
      const inv = createInvoice({ id: '1', invoiceNumber: 'INV/2425/001', customerId: 'cust-1', date: new Date().toISOString(), lines: [], subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });
      expect(inv.invoiceNumber).toBe('INV/2425/001');
      expect(inv.status).toBe('draft');
    });

    it('should reject invoice without required fields', () => {
      expect(() => createInvoice({ id: '1' })).toThrow();
    });

    it('should validate status values', () => {
      ['draft', 'confirmed', 'cancelled'].forEach(s => {
        const inv = createInvoice({ id: '1', invoiceNumber: 'INV/001', customerId: 'c1', date: new Date().toISOString(), status: s, lines: [], subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });
        expect(inv.status).toBe(s);
      });
    });
  });
});