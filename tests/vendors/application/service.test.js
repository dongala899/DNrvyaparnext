import { describe, it, expect, vi } from 'vitest';
import { VendorService } from '../../../src/modules/vendors/application/service.js';

describe('Vendors Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = { storage: { runQuery: vi.fn() }, commandBus: { handle: vi.fn() }, eventBus: { emit: vi.fn() }, logger: { info: vi.fn(), warn: vi.fn() }, sharedState: { getState: vi.fn() } };
    const service = new VendorService(mockDeps);
    expect(service).toBeDefined();
    expect(service.store).toBeDefined();
  });
});