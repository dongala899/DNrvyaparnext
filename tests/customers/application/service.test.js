import { describe, it, expect, vi } from 'vitest';
import { CustomerService } from '../../../src/modules/customers/application/service.js';

describe('Customers Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = {
      storage: { runQuery: vi.fn() },
      commandBus: { handle: vi.fn() },
      eventBus: { emit: vi.fn() },
      logger: { info: vi.fn(), warn: vi.fn() },
      sharedState: { getState: vi.fn() },
    };

    const service = new CustomerService(mockDeps);
    expect(service).toBeDefined();
    expect(service.store).toBeDefined();
  });

  it('should have store with setItems method', () => {
    const mockDeps = {
      storage: { runQuery: vi.fn() },
      commandBus: { handle: vi.fn() },
      eventBus: { emit: vi.fn() },
      logger: { info: vi.fn(), warn: vi.fn() },
      sharedState: { getState: vi.fn() },
    };

    const service = new CustomerService(mockDeps);
    expect(typeof service.store.setItems).toBe('function');
  });
});