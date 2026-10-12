import type { UserId, UserRole } from '../entities/user.entity.js';

/** Campos utilizados no fluxo atual de primeiro acesso de users. */
export interface UserRow {
  id: UserId;
  email: string;
  role: UserRole;
  status?: string;
  invite_token?: string | null;
}

/** Resultado da consulta de validação do token de redefinição. */
export interface ResetTokenRow {
  email: string;
  reset_password_expires: Date | string | null;
}
