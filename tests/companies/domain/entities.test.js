import { describe, it, expect } from 'vitest';
import { CompanySchema } from '../../../src/modules/companies/domain/entities.js';

describe('Companies Domain Entities', () => {
  it('should validate a valid company', () => {
    const company = CompanySchema.parse({
      name: 'Test Company',
      gstin: '27AABCCDDEEFFG',
      stateCode: '27',
    });
    expect(company.name).toBe('Test Company');
    expect(company.gstin).toBe('27AABCCDDEEFFG');
  });

  it('should reject company without name', () => {
    expect(() => CompanySchema.parse({ gstin: '27AABCCDDEEFFG' })).toThrow();
  });
});