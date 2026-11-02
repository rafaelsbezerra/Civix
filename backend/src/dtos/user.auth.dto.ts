import type { User, UserRole, UserId } from '../entities/user.entity.js';
import { z } from 'zod';

export const ownProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().transform(value => value.toLowerCase()),
}).strict();

export interface LoginInput {
  email: string;
  role?: UserRole;
  password?: string;
}

export type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'role'> & { companyId: string | null };

export interface LoginResult {
  user: PublicUser;
  token: string;
}

export interface PasswordResetInput {
  token: string;
  password: string;
}

export const companyUserInvitationSchema = z.object({ email: z.string().trim().email().transform(value => value.toLowerCase()),
  name: z.string().trim().min(1).max(120).optional(), role: z.enum(['admin_empresa','atendente']) }).strict();
export const superAdminInvitationSchema = companyUserInvitationSchema.omit({ role:true });
export const companyUserUpdateSchema = ownProfileSchema.extend({ role: z.enum(['admin_empresa','atendente']) });
export const suspensionReasonSchema = z.object({ reason: z.string().trim().min(1).max(2000) }).strict();
export interface UserAdministrationFilters { q?: string; role?: 'admin_empresa'|'atendente'; status?: 'active'|'pending'|'blocked'; offset: number; pageSize: number }
export interface UserAdministrationChange {
  actorId: UserId; companyId: string | null; action: 'invite'|'update'|'suspend'|'reactivate'|'delete';
  userId?: UserId; name?: string; email?: string; role?: 'admin_empresa'|'atendente'|'super_admin';
  token?: string; tokenIssuedAt?: string; reason?: string; changedAt: string;
}
