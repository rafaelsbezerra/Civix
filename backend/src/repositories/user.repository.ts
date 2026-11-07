import type { User, UserId, UserRole } from '../entities/user.entity.js';
import type {
  UserAdministrationChange,
  UserAdministrationFilters,
} from '../dtos/user.auth.dto.js';

/** Contrato compartilhado pelas implementações JSON e PostgreSQL. */
export interface UserRepository {
  getUsersForAdministration(
    companyId: string | null,
    filters: UserAdministrationFilters,
  ): Promise<{ items: User[]; total: number }>;
  changeUserAdministration(input: UserAdministrationChange): Promise<User>;
  updateOwnProfile(
    id: UserId,
    input: { name: string; email: string },
  ): Promise<User | undefined>;
  create(user: User): Promise<User>;
  getById(id: UserId): Promise<User | undefined>;
  getByEmail(email: string): Promise<Pick<User, 'id' | 'name' | 'email'> | undefined>;
  getByEmailAndRole(email: string, role: UserRole): Promise<User | undefined>;
  getForLogin(email: string): Promise<User | undefined>;
  getByValidResetTokenHash(tokenHash: string): Promise<Pick<User, 'id'> | undefined>;
  savePasswordResetToken(id: UserId, tokenHash: string, expiresAt: Date): Promise<void>;
  updatePasswordAndClearResetToken(id: UserId, passwordHash: string): Promise<void>;
  assignPlan(id: UserId, planId: string | number): Promise<boolean>;
}
