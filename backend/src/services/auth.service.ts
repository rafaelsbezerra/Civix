import { logger } from '../shared/logging/log.context.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authRepository } from '../persistence/auth.repository.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { sendForgotPasswordEmail } from './mail.service.js';
import { isAuthenticatedRole } from '../entities/user.entity.js';
import { companyRepository } from '../persistence/company.repository.js';
import type { JwtInvitePayload } from '../dtos/auth.invite.dto.js';
import type { UserRow } from '../interfaces/auth.user.row.js';

async function getInviteUser(token: string): Promise<UserRow> {
  const jwtSecret = process.env.JWT_INVITE_SECRET;
  if (!jwtSecret) {
    throw new AppError({
      status: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Erro interno do servidor',
    });
  }
  let decoded: JwtInvitePayload;

  try {
    decoded = jwt.verify(token, jwtSecret) as JwtInvitePayload;

    if (
      !decoded ||
      typeof decoded !== 'object' ||
      typeof decoded.email !== 'string' ||
      !decoded.email ||
      !isAuthenticatedRole(decoded.role) ||
      decoded.purpose !== 'invite' ||
      (decoded.role === 'super_admin'
        ? decoded.companyId !== null
        : typeof decoded.companyId !== 'string')
    ) {
      throw new Error('O token de convite não contém uma identidade válida.');
    }
  } catch (cause) {
    throw new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Link de convite inválido ou expirado.',
      cause,
    });
  }

  const user = await authRepository.getInviteUserByEmail(decoded.email, decoded.role);

  if (!user) {
    throw new AppError({
      status: 404,
      code: ErrorCode.NOT_FOUND,
      message: 'Usuário não encontrado.',
    });
  }

  const company = decoded.companyId
    ? await companyRepository.getById(decoded.companyId)
    : undefined;
  if (
    user.deleted_at ||
    (user.status ?? '').toLowerCase() !== 'pending' ||
    user.company_id !== decoded.companyId ||
    (decoded.role !== 'super_admin' &&
      (!company || company.status.toLowerCase() === 'inativo' || company.deleted_at))
  ) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Esta conta já foi ativada anteriormente.',
    });
  }

  if (
    user.tokens_revoked_at &&
    (typeof decoded.issuedAt !== 'string' ||
      !Number.isFinite(Date.parse(decoded.issuedAt)) ||
      Date.parse(decoded.issuedAt) <= new Date(user.tokens_revoked_at).getTime())
  ) {
    throw new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Convite revogado. Solicite um novo link.',
    });
  }

  if (user.invite_token !== token) {
    throw new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Este link de convite já foi utilizado ou é inválido.',
    });
  }

  logger().debug({
    event: 'auth.invite.validated',
    module: 'auth',
    message: 'Convite validado',
    context: {
      userId: user.id,
      role: decoded.role,
      persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres',
    },
  });

  return user;
}

export async function validateToken(token: string): Promise<{ email: string }> {
  const user = await getInviteUser(token);

  return { email: user.email };
}

export async function firstAccess(token: string, password: string): Promise<void> {
  const user = await getInviteUser(token);

  const passwordHash = await bcrypt.hash(password, 10);

  const activated = await authRepository.activateUser(user.id, passwordHash, token);

  if (!activated) {
    throw new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Este link de convite já foi utilizado ou é inválido.',
    });
  }

  logger().info({
    event: 'auth.first-access.completed',
    module: 'auth',
    message: 'Primeiro acesso concluído',
    context: { userId: user.id, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });
}

export async function resendInviteEmail(email: string): Promise<void> {
  const user = await authRepository.getResetUserByEmail(email);
  if (
    !user ||
    (user.status ?? '').toLowerCase() !== 'pending' ||
    !isAuthenticatedRole(user.role) ||
    user.role === 'super_admin' ||
    !user.company_id
  ) {
    return;
  }
  const adminService = await import('./admin.service.js');
  await adminService.inviteUser(email, user.role, user.company_id);
}

export function signToken(
  payload: string | object | Buffer,
  expiresIn: SignOptions['expiresIn'],
) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError({
      status: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Erro interno do servidor',
      details: { message: 'JWT_SECRET não informada nas variáveis de ambiente.' },
    });
  }

  return jwt.sign(payload, secret, { expiresIn });
}

export async function hashPassword(password: string, salt: number) {
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashPassword: string) {
  return bcrypt.compare(password, hashPassword);
}
