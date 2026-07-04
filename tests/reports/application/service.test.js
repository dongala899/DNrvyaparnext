import { describe, it, expect, vi } from 'vitest';
import { ReportsService } from '../../../src/modules/reports/application/service.js';

describe('Reports Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = { storage: { runQuery: vi.fn() }, commandBus: { invoke: vi.fn() }, eventBus: { emit: vi.fn() }, logger: { info: vi.fn() }, sharedState: { getState: vi.fn() } };
    const service = new ReportsService(mockDeps);
    expect(service).toBeDefined();
    expect(service.cache).toBeDefined();
  });
});