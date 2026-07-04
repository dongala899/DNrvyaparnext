import { describe, it, expect } from 'vitest';
import { VendorSchema, createVendor } from '../../../src/modules/vendors/domain/entities.js';

describe('Vendors Domain Entities', () => {
  describe('VendorSchema', () => {
    it('should validate a valid vendor', () => {
      const vendor = createVendor({ id: '1', name: 'Test Vendor', gstin: '27AABCD1234E1Z5' });
      expect(vendor.name).toBe('Test Vendor');
      expect(vendor.gstin).toBe('27AABCD1234E1Z5');
    });

    it('should reject vendor without name', () => {
      expect(() => createVendor({ id: '1' })).toThrow();
    });

    it('should default values', () => {
      const vendor = createVendor({ id: '1', name: 'Test' });
      expect(vendor.country).toBe('India');
      expect(vendor.openingBalance).toBe(0);
      expect(vendor.isActive).toBe(true);
    });
  });
});