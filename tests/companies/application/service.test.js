import { describe, it, expect, vi } from 'vitest';
import { CompanyService } from '../../../src/modules/companies/application/service.js';

describe('Companies Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = {
      storage: { runQuery: vi.fn() },
      commandBus: { handle: vi.fn() },
      eventBus: { emit: vi.fn() },
      logger: { info: vi.fn(), warn: vi.fn() },
      sharedState: { getCurrent: vi.fn(), setCurrentCompany: vi.fn(), getState: vi.fn() },
    };

    const service = new CompanyService(mockDeps);
    expect(service).toBeDefined();
  });
});