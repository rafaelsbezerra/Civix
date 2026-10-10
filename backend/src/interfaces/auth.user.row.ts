/** Campos utilizados no fluxo atual de primeiro acesso. */
export interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  invite_token: string | null;
}

/** Resultado da consulta de validação do token de redefinição. */
export interface ResetTokenRow {
  email: string;
  reset_password_expires: Date | string;
}
