import { describe, it, expect } from 'vitest';
import { PurchaseOrderSchema, GrnSchema, createPurchaseOrder, createGrn } from '../../../src/modules/vendor-po/domain/entities.js';

describe('Vendor PO Domain Entities', () => {
  describe('PurchaseOrderSchema', () => {
    it('should validate a valid PO', () => {
      const po = createPurchaseOrder({ id: '1', poNumber: 'PO/2425/001', vendorId: 'v1', date: new Date().toISOString(), lines: [], subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });
      expect(po.poNumber).toBe('PO/2425/001');
      expect(po.status).toBe('draft');
    });

    it('should reject PO without required fields', () => {
      expect(() => createPurchaseOrder({ id: '1' })).toThrow();
    });

    it('should validate status values', () => {
      ['draft', 'issued', 'closed', 'cancelled'].forEach(s => {
        const po = createPurchaseOrder({ id: '1', poNumber: 'PO/001', vendorId: 'v1', date: new Date().toISOString(), status: s, lines: [], subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });
        expect(po.status).toBe(s);
      });
    });
  });

  describe('GrnSchema', () => {
    it('should validate a valid GRN', () => {
      const grn = createGrn({ id: '1', grnNumber: 'GRN/2024/001', poId: 'po-1', date: new Date().toISOString(), lines: [] });
      expect(grn.grnNumber).toBe('GRN/2024/001');
    });
  });
});