import { z } from 'zod';

export const UserAccountSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  roleId: z.string().min(1, 'Role is required'),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const ROLES = [
  { id: 'role_admin', name: 'Admin', description: 'Full access' },
  { id: 'role_manager', name: 'Manager', description: 'Manage transactions and reports' },
  { id: 'role_operator', name: 'Operator', description: 'Create and view transactions' },
];

export function createUserAccount(data) {
  return UserAccountSchema.parse(data);
}

export function createRole(data) {
  return RoleSchema.parse(data);
}