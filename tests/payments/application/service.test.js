import { describe, it, expect, vi } from 'vitest';
import { PaymentService } from '../../../src/modules/payments/application/service.js';

describe('Payments Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = { storage: { runQuery: vi.fn() }, commandBus: { invoke: vi.fn() }, eventBus: { emit: vi.fn() }, logger: { info: vi.fn() }, sharedState: { getState: vi.fn() } };
    const service = new PaymentService(mockDeps);
    expect(service).toBeDefined();
    expect(service.store).toBeDefined();
  });
});