import { describe, it, expect } from 'vitest';
import { PurchaseSchema, createPurchase } from '../../../src/modules/purchases/domain/entities.js';

describe('Purchases Domain Entities', () => {
  describe('PurchaseSchema', () => {
    it('should validate a valid purchase', () => {
      const p = createPurchase({ id: '1', billNumber: 'PB/2024/001', vendorId: 'v1', date: new Date().toISOString(), lines: [], subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });
      expect(p.billNumber).toBe('PB/2024/001');
      expect(p.status).toBe('draft');
    });

    it('should reject purchase without required fields', () => {
      expect(() => createPurchase({ id: '1' })).toThrow();
    });

    it('should validate status values', () => {
      ['draft', 'booked', 'cancelled'].forEach(s => {
        const p = createPurchase({ id: '1', billNumber: 'PB/001', vendorId: 'v1', date: new Date().toISOString(), status: s, lines: [], subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });
        expect(p.status).toBe(s);
      });
    });
  });
});