import type { User, UserId, UserRole } from '../entities/user.entity.js';
import type { UserRow } from '../interfaces/auth.user.row.js';

/** Operações de convite, ativação e recuperação na identidade users. */
export interface AuthRepository {
  getInviteUserByEmail(email: string, role?: UserRole): Promise<UserRow | undefined>;
  activateUser(id: UserId, passwordHash: string, token: string): Promise<boolean>;
  getResetUserByEmail(email: string): Promise<User | undefined>;
  saveResetToken(id: UserId, token: string): Promise<void>;
  saveInvite(email: string, role: UserRole, token: string, existingId?: UserId, companyId?: string | null): Promise<void>;
}
