import type { User, UserRole } from '../entities/user.entity.js';

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
