export const USER_ROLES = ['admin_empresa', 'super_admin', 'cliente', 'atendente'] as const;
export type UserRole = typeof USER_ROLES[number];
export type AuthenticatedRole = Exclude<UserRole, 'cliente'>;
// PostgreSQL utiliza UUID; números são preservados apenas para snapshots locais legados.
export type UserId = string | number;

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function isAuthenticatedRole(value: unknown): value is AuthenticatedRole {
  return isUserRole(value) && value !== 'cliente';
}

/** Campos observados nas consultas atuais; não define um novo schema de banco. */
export interface User {
  id: UserId;
  email: string;
  role: UserRole;
  name?: string;
  password_hash?: string;
  status?: string;
  invite_token?: string | null;
  company_id?: string | null;
}

export interface AuthenticatedUser extends User {
  role: AuthenticatedRole;
  company_id: string | null;
}
