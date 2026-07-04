import { describe, it, expect, vi } from 'vitest';
import { ItemService } from '../../../src/modules/items/application/service.js';

describe('Items Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = {
      storage: { runQuery: vi.fn() },
      commandBus: { handle: vi.fn() },
      eventBus: { emit: vi.fn() },
      logger: { info: vi.fn(), warn: vi.fn() },
      sharedState: { getState: vi.fn() },
    };
    const service = new ItemService(mockDeps);
    expect(service).toBeDefined();
    expect(service.store).toBeDefined();
  });
});