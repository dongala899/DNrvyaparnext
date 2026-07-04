import { describe, it, expect } from 'vitest';
import { QuotationSchema, LineItemSchema, createQuotation, createLineItem } from '../../../src/modules/quotations/domain/entities.js';

describe('Quotations Domain Entities', () => {
  describe('LineItemSchema', () => {
    it('should validate a valid line item', () => {
      const line = createLineItem({ id: '1', itemId: 'item-1', quantity: 2, rate: 100, discount: 0, gstRate: 18, subtotal: 200, total: 236 });
      expect(line.quantity).toBe(2);
      expect(line.rate).toBe(100);
      expect(line.gstRate).toBe(18);
    });
  });

  describe('QuotationSchema', () => {
    it('should validate a valid quotation', () => {
      const q = createQuotation({ id: '1', quotationNumber: 'QT/2425/001', customerId: 'cust-1', date: new Date().toISOString(), lines: [], subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });
      expect(q.quotationNumber).toBe('QT/2425/001');
      expect(q.status).toBe('draft');
    });

    it('should reject quotation without required fields', () => {
      expect(() => createQuotation({ id: '1' })).toThrow();
    });

    it('should validate status values', () => {
      ['draft', 'final'].forEach(s => {
        const q = createQuotation({ id: '1', quotationNumber: 'QT/001', customerId: 'c1', date: new Date().toISOString(), status: s, lines: [], subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });
        expect(q.status).toBe(s);
      });
    });
  });
});