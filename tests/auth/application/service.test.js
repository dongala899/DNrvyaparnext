import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../../../src/modules/auth/application/service.js';

describe('Auth Application Service', () => {
  it('should create service with dependencies', () => {
    const mockDeps = {
      storage: { runQuery: vi.fn() },
      commandBus: { handle: vi.fn() },
      eventBus: { emit: vi.fn() },
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      sharedState: { setCurrentUser: vi.fn(), getState: vi.fn() },
    };

    const service = new AuthService(mockDeps);
    expect(service).toBeDefined();
  });
});