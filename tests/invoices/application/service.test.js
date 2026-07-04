import { describe, it, expect, vi } from 'vitest';
import { InvoiceService } from '../../../src/modules/invoices/application/service.js';

describe('Invoices Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = { storage: { runQuery: vi.fn() }, commandBus: { handle: vi.fn() }, eventBus: { emit: vi.fn() }, logger: { info: vi.fn() }, sharedState: { getState: vi.fn() } };
    const service = new InvoiceService(mockDeps);
    expect(service).toBeDefined();
    expect(service.store).toBeDefined();
  });
});