import type { User, UserRole } from '../entities/user.entity.js';

export interface LoginInput {
  email: string;
  role: UserRole;
  password?: string;
}

export type PublicUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;
export type LoginFailure = 'userNotFound' | 'passwordRequired' | 'passwordHashMissing' | 'invalidPassword' | 'jwtSecretMissing';
export type LoginResult =
  | { success: true; user: PublicUser; token: string }
  | { success: false; reason: LoginFailure };

export interface PasswordResetInput {
  token: string;
  password: string;
}
