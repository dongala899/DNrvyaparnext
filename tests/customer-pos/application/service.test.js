import { describe, it, expect, vi } from 'vitest';
import { PosService } from '../../../src/modules/customer-pos/application/service.js';

describe('Customer POS Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = { storage: { runQuery: vi.fn() }, commandBus: { invoke: vi.fn() }, eventBus: { emit: vi.fn() }, logger: { info: vi.fn() }, sharedState: { getState: vi.fn() } };
    const service = new PosService(mockDeps);
    expect(service).toBeDefined();
    expect(service.cart).toBeDefined();
  });

  it('should start with empty cart', () => {
    const mockDeps = { storage: { runQuery: vi.fn() }, commandBus: { invoke: vi.fn() }, eventBus: { emit: vi.fn() }, logger: { info: vi.fn() }, sharedState: { getState: vi.fn() } };
    const service = new PosService(mockDeps);
    expect(service.getCart().lines).toEqual([]);
  });
});