import { describe, it, expect, vi } from 'vitest';
import { VendorPoService } from '../../../src/modules/vendor-po/application/service.js';

describe('Vendor POS Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = { storage: { runQuery: vi.fn() }, commandBus: { invoke: vi.fn() }, eventBus: { emit: vi.fn() }, logger: { info: vi.fn() }, sharedState: { getState: vi.fn() } };
    const service = new VendorPoService(mockDeps);
    expect(service).toBeDefined();
    expect(service.store).toBeDefined();
  });
});