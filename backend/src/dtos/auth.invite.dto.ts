import type { UserRole } from '../entities/user.entity.js';

export interface JwtInvitePayload {
  email: string;
  role: UserRole;
  companyId: string | null;
  purpose: 'invite';
  issuedAt?: string;
}
