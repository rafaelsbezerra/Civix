import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import crypto from 'node:crypto';
import { userRepository } from '../persistence/user.repository.js';
import * as mailService from './mail.service.js';
import * as authService from './auth.service.js';
import type { LoginInput, LoginResult, PasswordResetInput } from '../dtos/user.auth.dto.js';

export async function login({ email, role, password }: LoginInput): Promise<LoginResult> {
  if (role === 'empresa' && !password) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Senha é obrigatória para empresas',
    });
  }

  const user = await userRepository.getByEmailAndRole(email, role);

  if (!user) {
    throw new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Usuário não encontrado.',
    });
  }

  if (user.status === 'pending') {
    throw new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Conclua o primeiro acesso antes de entrar.',
    });
  }

  if (role === 'empresa') {
    if (!user.password_hash) {
      throw new AppError({
        status: 500,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Erro interno do servidor',
        details: { message: 'Usuário da empresa não possui senha cadastrada.' },
      });
    }

    if (!password) {
      throw new AppError({
        status: 400,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Senha é obrigatória para empresas',
      });
    }

    if (!await authService.comparePassword(password, user.password_hash)) {
      throw new AppError({
        status: 401,
        code: ErrorCode.UNAUTHORIZED,
        message: 'Senha incorreta.',
      });
    }
  }

  const payload = { id: user.id, email: user.email, role: user.role };

  const token = authService.signToken(payload, '1h');

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
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

}
