import type { User, UserId, UserRole } from '../entities/user.entity.js';
import type { UserRow, ResetTokenRow } from '../interfaces/auth.user.row.js';

/** Operações dos fluxos atuais; preserva a distinção entre users e user. */
export interface AuthRepository {
  getByResetToken(token: string): Promise<ResetTokenRow | undefined>;
  getLegacyByEmail(email: string): Promise<UserRow | undefined>;
  activateLegacy(email: string, passwordHash: string): Promise<void>;
  getResetUserByEmail(email: string): Promise<User | undefined>;
  saveResetToken(id: UserId, token: string): Promise<void>;
  saveInvite(email: string, role: UserRole, token: string, existing: boolean): Promise<void>;
}