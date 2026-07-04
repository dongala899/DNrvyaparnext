import { describe, it, expect } from 'vitest';
import { CustomerSchema, AddressSchema, createCustomer, createAddress } from '../../../src/modules/customers/domain/entities.js';

describe('Customers Domain Entities', () => {
  describe('AddressSchema', () => {
    it('should validate a valid address', () => {
      const address = createAddress({
        line1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      });
      expect(address.line1).toBe('123 Main St');
      expect(address.city).toBe('Mumbai');
    });

    it('should default country to India', () => {
      const address = createAddress({ city: 'Pune' });
      expect(address.country).toBe('India');
    });
  });

  describe('CustomerSchema', () => {
    it('should validate a valid customer', () => {
      const customer = createCustomer({
        id: '1',
        name: 'Test Customer',
        email: 'test@example.com',
        creditLimit: 10000,
        creditDays: 30,
      });
      expect(customer.name).toBe('Test Customer');
      expect(customer.creditLimit).toBe(10000);
    });

    it('should reject customer without name', () => {
      expect(() => createCustomer({ id: '1' })).toThrow();
    });

    it('should default credit values', () => {
      const customer = createCustomer({ id: '1', name: 'Test' });
      expect(customer.creditLimit).toBe(0);
      expect(customer.creditDays).toBe(0);
      expect(customer.isActive).toBe(true);
    });
  });
});