import { describe, it, expect } from 'vitest';
import { ItemSchema, createItem } from '../../../src/modules/items/domain/entities.js';

describe('Items Domain Entities', () => {
  describe('ItemSchema', () => {
    it('should validate a valid item', () => {
      const item = createItem({
        id: '1',
        name: 'Widget',
        sku: 'WID-001',
        sellingPrice: 100,
        taxRate: 18,
      });
      expect(item.name).toBe('Widget');
      expect(item.sku).toBe('WID-001');
      expect(item.sellingPrice).toBe(100);
    });

    it('should reject item without name', () => {
      expect(() => createItem({ id: '1' })).toThrow();
    });

    it('should default values', () => {
      const item = createItem({ id: '1', name: 'Test' });
      expect(item.unit).toBe('PCS');
      expect(item.purchasePrice).toBe(0);
      expect(item.sellingPrice).toBe(0);
      expect(item.taxRate).toBe(0);
      expect(item.isActive).toBe(true);
    });

    it('should reject tax rate over 100', () => {
      expect(() => createItem({ id: '1', name: 'Test', taxRate: 101 })).toThrow();
    });
  });
});