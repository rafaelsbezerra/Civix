import { logger } from '../shared/logging/log.context.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import crypto from 'node:crypto';
import { userRepository } from '../persistence/user.repository.js';
import * as mailService from './mail.service.js';
import * as authService from './auth.service.js';
import type { LoginInput, LoginResult, PasswordResetInput } from '../dtos/user.auth.dto.js';
import { AuthenticatedUser, isAuthenticatedRole } from '../entities/user.entity.js';
import { companyRepository } from '../persistence/company.repository.js';

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
  const current = await getAuthenticatedUser(user.id);
  if (!await authService.comparePassword(password, current.password_hash!)) {
    throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Credenciais inválidas.' });
  }
  const token = authService.signToken({
    id: current.id, email: current.email, role: current.role,
    companyId: current.company_id, tokenVersion: 2,
  }, '1h');
  logger().info({ event: 'user.authenticated', module: 'users', message: 'Autenticação concluída',
    context: { userId: current.id, role: current.role, companyId: current.company_id ?? undefined, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' } });
  return {
    user: { id: current.id, name: current.name ?? undefined, email: current.email,
      role: current.role, companyId: current.company_id },
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

export async function getAuthenticatedUser(id: string): Promise<AuthenticatedUser> {
  const user = await userRepository.getById(id);
  if (!user || !isAuthenticatedRole(user.role)
    || (user.status != null && user.status !== 'active') || !user.password_hash) {
    throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Acesso inválido. Faça login novamente.' });
  }
  const companyId = user.company_id ?? null;
  if (user.role === 'super_admin') {
    if (companyId !== null) {
      throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Vínculo de acesso inválido.' });
    }
  } else {
    const company = companyId ? await companyRepository.getById(companyId) : undefined;
    if (!company || company.status === 'inativo') {
      throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Empresa indisponível ou vínculo inválido.' });
    }
  }
  return { ...user, role: user.role, company_id: companyId };
}
