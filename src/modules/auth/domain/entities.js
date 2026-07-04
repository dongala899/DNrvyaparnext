import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  roleId: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const SessionSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.string().datetime(),
});

export function createUser(data) {
  return UserSchema.parse(data);
}

export function createLoginRequest(data) {
  return LoginRequestSchema.parse(data);
}