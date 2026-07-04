import { z } from 'zod';

export const LicenseStatus = z.enum(['unlicensed', 'trial', 'licensed', 'expired']);

export const LicenseInfoSchema = z.object({
  status: LicenseStatus,
  licenseKey: z.string().optional(),
  machineFingerprint: z.string().optional(),
  activatedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  trialDaysRemaining: z.number().optional(),
  features: z.array(z.string()).default([]),
});

export const LicenseKeySchema = z.object({
  key: z.string().min(1, 'License key is required'),
});

export function createLicenseInfo(data) {
  return LicenseInfoSchema.parse(data);
}

export function createLicenseKeyRequest(data) {
  return LicenseKeySchema.parse(data);
}