import { logger } from '../shared/logging/log.context.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import crypto from 'node:crypto';
import { userRepository } from '../persistence/user.repository.js';
import * as mailService from './mail.service.js';
import * as authService from './auth.service.js';
import type { LoginInput, LoginResult, PasswordResetInput } from '../dtos/user.auth.dto.js';
import { type AuthenticatedUser, type UserId, isAuthenticatedRole } from '../entities/user.entity.js';
import { companyRepository } from '../persistence/company.repository.js';
import { ownProfileSchema, companyUserInvitationSchema, superAdminInvitationSchema, companyUserUpdateSchema, suspensionReasonSchema, type UserAdministrationChange } from '../dtos/user.auth.dto.js';
import type { User } from '../entities/user.entity.js';
import { createInviteToken } from './admin.service.js';
import { z } from 'zod';
import { parsePagination, createPaginationMeta } from '../shared/contracts/pagination.contract.js';

export function presentManagedUser(user: User) {
  return {
    id: user.id, name: user.name || '', email: user.email, role: user.role, status: user.status || 'active', companyId: user.company_id ?? null,
    deactivationReason: user.deactivation_reason ?? null,
    invitationStatus: user.password_hash ? 'accepted' : user.invite_token ? 'pending' : 'invalidated'
  };
}
function validateCompanyScope(companyId: string | null) {
  if (companyId !== null && !z.string().uuid().safeParse(companyId).success) throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'ID da empresa inválido.' });
}
function validateManagedUserId(id: string) {
  if (!id || id.length > 128 || !USE_MOCK_DATA && !z.string().uuid().safeParse(id).success) throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'ID do usuário inválido.' });
}
async function listManagedUsers(actorId: UserId, companyId: string | null, input: unknown) {
  await requireSuperAdminActor(actorId); validateCompanyScope(companyId);
  if (companyId !== null && !await companyRepository.getById(companyId)) throw new AppError({ status: 404, code: ErrorCode.NOT_FOUND, message: 'Empresa não encontrada.' });
  const parsed = z.object({ q: z.string().trim().max(200).optional(), role: z.enum(['admin_empresa', 'atendente']).optional(), status: z.enum(['active', 'pending', 'blocked']).optional(), page: z.unknown().optional(), limit: z.unknown().optional() }).strict().safeParse(input);
  if (!parsed.success || companyId === null && parsed.data.role) throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'Filtros de usuários inválidos.' });
  const pagination = parsePagination({ page: parsed.data.page, pageSize: parsed.data.limit });
  const result = await userRepository.getUsersForAdministration(companyId, { ...parsed.data, ...pagination });
  return { data: result.items.map(presentManagedUser), meta: createPaginationMeta(pagination, result.total) };
}
export async function getUsersByCompanyId(actorId: UserId, companyId: string, input: unknown) { return listManagedUsers(actorId, companyId, input); }
export async function getSuperAdmins(actorId: UserId, input: unknown) { return listManagedUsers(actorId, null, input); }

async function inviteManagedUser(actorId: UserId, companyId: string | null, input: unknown) {
  await requireSuperAdminActor(actorId); validateCompanyScope(companyId);
  const parsed = (companyId === null ? superAdminInvitationSchema : companyUserInvitationSchema).safeParse(input);
  if (!parsed.success) throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'Dados de convite inválidos.' });
  const role = companyId === null ? 'super_admin' : companyUserInvitationSchema.parse(input).role;
  const invitationStartedAt = Date.now();
  const existing = await userRepository.getForLogin(parsed.data.email);
  const tokenIssuedAt = new Date(Math.max(invitationStartedAt, existing?.tokens_revoked_at ? new Date(existing.tokens_revoked_at).getTime() + 1 : 0)).toISOString();
  const token = createInviteToken(parsed.data.email, role, companyId, tokenIssuedAt);
  const user = await userRepository.changeUserAdministration({ actorId, companyId, action: 'invite', email: parsed.data.email, name: parsed.data.name, role, token, tokenIssuedAt, changedAt: new Date().toISOString() });
  try { await mailService.sendInviteEmail({ email: user.email, role: user.role, token }); }
  catch (cause) { throw new AppError({ status: 502, code: ErrorCode.INTERNAL_ERROR, message: 'Convite salvo; não foi possível confirmar o envio do e-mail. Reenvie o convite.', cause }); }
  return { user: presentManagedUser(user), message: 'Convite preparado e enviado.' };
}
export async function inviteCompanyUser(actorId: UserId, companyId: string, input: unknown) { return inviteManagedUser(actorId, companyId, input); }
export async function inviteSuperAdmin(actorId: UserId, input: unknown) { return inviteManagedUser(actorId, null, input); }

async function changeManagedUser(actorId: UserId, companyId: string | null, userId: string, action: Exclude<UserAdministrationChange['action'], 'invite'>, input: unknown) {
  await requireSuperAdminActor(actorId); validateCompanyScope(companyId); validateManagedUserId(userId);
  const schema = action === 'update' ? companyId === null ? ownProfileSchema : companyUserUpdateSchema
    : action === 'suspend' || action === 'delete' ? suspensionReasonSchema : z.object({}).strict();
  const parsed = schema.safeParse(input ?? {});
  if (!parsed.success) throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'Dados inválidos; desativar ou excluir exige motivo.' });
  const data = parsed.data as { name?: string; email?: string; role?: 'admin_empresa' | 'atendente'; reason?: string };
  const user = await userRepository.changeUserAdministration({ ...data, actorId, companyId, userId, action, changedAt: new Date().toISOString() });
  return presentManagedUser(user);
}
export async function updateCompanyUser(actorId: UserId, companyId: string, userId: string, input: unknown) { return changeManagedUser(actorId, companyId, userId, 'update', input); }
export async function suspendCompanyUser(actorId: UserId, companyId: string, userId: string, input: unknown) { return changeManagedUser(actorId, companyId, userId, 'suspend', input); }
export async function reactivateCompanyUser(actorId: UserId, companyId: string, userId: string, input: unknown = {}) { return changeManagedUser(actorId, companyId, userId, 'reactivate', input); }
export async function deleteCompanyAttendant(actorId: UserId, companyId: string, userId: string, input: unknown) { return changeManagedUser(actorId, companyId, userId, 'delete', input); }
export async function updateSuperAdmin(actorId: UserId, userId: string, input: unknown) { return changeManagedUser(actorId, null, userId, 'update', input); }
export async function suspendSuperAdmin(actorId: UserId, userId: string, input: unknown) { return changeManagedUser(actorId, null, userId, 'suspend', input); }
export async function reactivateSuperAdmin(actorId: UserId, userId: string, input: unknown = {}) { return changeManagedUser(actorId, null, userId, 'reactivate', input); }

export async function requireSuperAdminActor(id: UserId) {
  const user = await getAuthenticatedUser(id);
  if (user.role !== 'super_admin') throw new AppError({ status: 403, code: ErrorCode.FORBIDDEN, message: 'Acesso exclusivo da administração da Civix.' });
  return user;
}

export async function updateOwnProfile(id: UserId, input: unknown) {
  const current = await getAuthenticatedUser(id);
  const parsed = ownProfileSchema.safeParse(input);
  if (!parsed.success) throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'Nome e e-mail do perfil inválidos.' });
  const updated = await userRepository.updateOwnProfile(current.id, parsed.data);
  if (!updated) throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Acesso inválido. Faça login novamente.' });
  return {
    user: {
      id: updated.id, name: updated.name, email: updated.email, role: updated.role,
      companyId: updated.company_id ?? null
    }, requiresLogin: current.email.toLowerCase() !== updated.email.toLowerCase()
  };
}

export async function login({ email, role, password }: LoginInput): Promise<LoginResult> {
  if (role === 'cliente') {
    throw new AppError({ status: 403, code: ErrorCode.FORBIDDEN, message: 'Cliente não possui acesso à área logada.' });
  }
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'E-mail e senha são obrigatórios.' });
  }
  const user = await userRepository.getForLogin(email.trim());
  if (!user || (role !== undefined && user.role !== role)) {
    throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Credenciais inválidas.' });
  }
  if (user.role === 'cliente') {
    throw new AppError({ status: 403, code: ErrorCode.FORBIDDEN, message: 'Cliente não possui acesso à área logada.' });
  }
  const authenticationStartedAt = Date.now();
  const current = await getAuthenticatedUser(user.id);
  if (!await authService.comparePassword(password, current.password_hash!)) {
    throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Credenciais inválidas.' });
  }
  const token = authService.signToken({
    id: current.id, email: current.email, role: current.role,
    companyId: current.company_id, tokenVersion: 2,
    issuedAt: new Date(Math.max(authenticationStartedAt, current.tokens_revoked_at ? new Date(current.tokens_revoked_at).getTime() + 1 : 0)).toISOString(),
  }, '1h');
  logger().info({
    event: 'user.authenticated', module: 'users', message: 'Autenticação concluída',
    context: { userId: current.id, role: current.role, companyId: current.company_id ?? undefined, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' }
  });
  return {
    user: {
      id: current.id, name: current.name ?? undefined, email: current.email,
      role: current.role, companyId: current.company_id
    },
    token,
  };
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await userRepository.getByEmail(email);

  // Não revelar se o endereço está cadastrado.
  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');

  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  const expiresAt = new Date(Date.now() + 3600000);

  await userRepository.savePasswordResetToken(user.id, resetTokenHash, expiresAt);

  logger().info({
    event: 'user.password-reset.prepared',
    module: 'users',
    message: 'Recuperação de senha preparada',
    context: { userId: user.id, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/redefinir-senha?token=${encodeURIComponent(resetToken)}`;

  await mailService.sendResetPasswordEmail({ email: user.email, resetUrl });
}

export async function resetPassword({ token, password }: PasswordResetInput): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await userRepository.getByValidResetTokenHash(tokenHash);

  if (!user) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Token inválido ou expirado.',
    });
  }

  const passwordHash = await authService.hashPassword(password, 10);

  await userRepository.updatePasswordAndClearResetToken(user.id, passwordHash);

  logger().info({
    event: 'user.password.changed',
    module: 'users',
    message: 'Senha atualizada',
    context: { userId: user.id, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

}

export async function getAuthenticatedUser(id: UserId): Promise<AuthenticatedUser> {
  const user = await userRepository.getById(id);
  if (!user || !isAuthenticatedRole(user.role)
    || !!user.deleted_at || (user.status != null && user.status !== 'active') || !user.password_hash) {
    throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Acesso inválido. Faça login novamente.' });
  }
  const companyId = user.company_id ?? null;
  if (user.role === 'super_admin') {
    if (companyId !== null) {
      throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Vínculo de acesso inválido.' });
    }
  } else {
    const company = companyId ? await companyRepository.getById(companyId) : undefined;
    if (!company || company.status === 'inativo' || company.deleted_at) {
      throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Empresa indisponível ou vínculo inválido.' });
    }
  }
  return { ...user, role: user.role, company_id: companyId };
}
