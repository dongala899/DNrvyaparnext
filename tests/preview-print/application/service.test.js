import { describe, it, expect, vi } from 'vitest';
import { PreviewPrintService } from '../../../src/modules/preview-print/application/service.js';

describe('Preview-Print Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = { storage: { runQuery: vi.fn() }, commandBus: { invoke: vi.fn() }, eventBus: { emit: vi.fn() }, logger: { info: vi.fn() }, sharedState: { getState: vi.fn() } };
    const service = new PreviewPrintService(mockDeps);
    expect(service).toBeDefined();
    expect(service.state).toBeDefined();
  });

  it('should start with closed preview', () => {
    const mockDeps = { storage: { runQuery: vi.fn() }, commandBus: { invoke: vi.fn() }, eventBus: { emit: vi.fn() }, logger: { info: vi.fn() }, sharedState: { getState: vi.fn() } };
    const service = new PreviewPrintService(mockDeps);
    expect(service.getPreviewState().isOpen).toBe(false);
  });
});