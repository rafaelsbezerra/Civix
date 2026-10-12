export type UserId = string | number;
export type UserRole = 'empresa' | 'cliente';

/** Campos observados nas consultas atuais; não define um novo schema de banco. */
export interface User {
  id: UserId;
  email: string;
  role: UserRole;
  name?: string;
  password_hash?: string;
  status?: string;
  invite_token?: string | null;
}
