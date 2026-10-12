import type { User, UserId, UserRole } from '../entities/user.entity.js';

/** Contrato compartilhado pelas implementações JSON e PostgreSQL. */
export interface UserRepository {
  getById(id: UserId): Promise<User | undefined>;
  getByEmail(email: string): Promise<Pick<User, 'id' | 'name' | 'email'> | undefined>;
  getByEmailAndRole(email: string, role: UserRole): Promise<User | undefined>;
  getByValidResetTokenHash(tokenHash: string): Promise<Pick<User, 'id'> | undefined>;
  savePasswordResetToken(id: UserId, tokenHash: string, expiresAt: Date): Promise<void>;
  updatePasswordAndClearResetToken(id: UserId, passwordHash: string): Promise<void>;
  assignPlan(id: UserId, planId: string | number): Promise<boolean>;
}
