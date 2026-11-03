import type { UserId, UserRole } from '../entities/user.entity.js';

/** Campos utilizados no fluxo atual de primeiro acesso de users. */
export interface UserRow {
  id: UserId;
  email: string;
  role: UserRole;
  status?: string;
  deleted_at?: string | null;
  deactivation_reason?: string | null;
  tokens_revoked_at?: string | Date | null;
  company_id?: string | null;
  invite_token?: string | null;
}
