import { describe, it, expect } from 'vitest';
import { LicenseInfoSchema, LicenseStatus } from '../../../src/modules/license/domain/entities.js';

describe('License Domain Entities', () => {
  it('should validate license info', () => {
    const info = LicenseInfoSchema.parse({
      status: 'trial',
      trialDaysRemaining: 15,
    });
    expect(info.status).toBe('trial');
    expect(info.trialDaysRemaining).toBe(15);
  });

  it('should accept all valid statuses', () => {
    ['unlicensed', 'trial', 'licensed', 'expired'].forEach((status) => {
      const info = LicenseInfoSchema.parse({ status });
      expect(info.status).toBe(status);
    });
  });
});