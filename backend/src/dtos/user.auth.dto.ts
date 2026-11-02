import type { User, UserRole } from '../entities/user.entity.js';
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
