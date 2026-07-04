import { describe, it, expect } from 'vitest';
import { UserSchema, LoginRequestSchema, createLoginRequest } from '../../../src/modules/auth/domain/entities.js';

describe('Auth Domain Entities', () => {
  describe('UserSchema', () => {
    it('should validate a valid user', () => {
      const user = UserSchema.parse({
        id: '1',
        username: 'admin',
        fullName: 'Admin User',
        email: 'admin@example.com',
        roleId: 'role_admin',
        isActive: true,
      });
      expect(user.username).toBe('admin');
    });

    it('should reject user without required fields', () => {
      expect(() => UserSchema.parse({ username: '' })).toThrow();
    });
  });

  describe('LoginRequestSchema', () => {
    it('should validate login request', () => {
      const request = createLoginRequest({ username: 'admin', password: 'secret' });
      expect(request.username).toBe('admin');
    });

    it('should reject empty username', () => {
      expect(() => createLoginRequest({ username: '', password: 'secret' })).toThrow();
    });

    it('should reject empty password', () => {
      expect(() => createLoginRequest({ username: 'admin', password: '' })).toThrow();
    });
  });
});