import { describe, it, expect } from 'vitest';
import { PaymentSchema, createPayment } from '../../../src/modules/payments/domain/entities.js';

describe('Payments Domain Entities', () => {
  describe('PaymentSchema', () => {
    it('should validate a valid payment', () => {
      const p = createPayment({ id: '1', invoiceId: 'inv-1', customerId: 'cust-1', amount: 1000, paymentMode: 'cash', paymentDate: new Date().toISOString() });
      expect(p.amount).toBe(1000);
      expect(p.paymentMode).toBe('cash');
    });

    it('should reject payment without required fields', () => {
      expect(() => createPayment({ id: '1', paymentMode: 'cash' })).toThrow();
    });

    it('should validate payment modes', () => {
      ['cash', 'bank', 'upi', 'card', 'cheque', 'other'].forEach(mode => {
        const p = createPayment({ id: '1', invoiceId: 'i1', customerId: 'c1', amount: 100, paymentMode: mode, paymentDate: new Date().toISOString() });
        expect(p.paymentMode).toBe(mode);
      });
    });
  });
});