import { describe, it, expect } from 'vitest';
import { CartLineSchema, PosStateSchema, createCartLine, createPosState } from '../../../src/modules/customer-pos/domain/entities.js';

describe('Customer POS Domain Entities', () => {
  describe('CartLineSchema', () => {
    it('should validate a valid cart line', () => {
      const line = createCartLine({ id: '1', itemId: 'item-1', quantity: 2, rate: 100, discount: 10, gstRate: 18, subtotal: 200, total: 244 });
      expect(line.quantity).toBe(2);
      expect(line.total).toBe(244);
    });
  });

  describe('PosStateSchema', () => {
    it('should validate pos state', () => {
      const state = createPosState({ customerId: 'c1', customerName: 'Test', lines: [] });
      expect(state.customerId).toBe('c1');
      expect(state.lines).toEqual([]);
    });

    it('should default lines to empty array', () => {
      const state = createPosState({});
      expect(state.lines).toEqual([]);
    });
  });
});