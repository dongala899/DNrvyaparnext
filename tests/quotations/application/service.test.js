import { describe, it, expect, vi } from 'vitest';
import { QuotationService } from '../../../src/modules/quotations/application/service.js';

describe('Quotations Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = { storage: { runQuery: vi.fn() }, commandBus: { handle: vi.fn() }, eventBus: { emit: vi.fn() }, logger: { info: vi.fn() }, sharedState: { getState: vi.fn() } };
    const service = new QuotationService(mockDeps);
    expect(service).toBeDefined();
    expect(service.store).toBeDefined();
  });
});