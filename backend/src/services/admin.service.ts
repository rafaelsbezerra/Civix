import jwt from 'jsonwebtoken';
import type { UserRole } from '../entities/user.entity.js';
import { authRepository } from '../persistence/auth.repository.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { sendInviteEmail } from './mail.service.js';

export async function inviteUser(email: string, role: UserRole): Promise<void> {
  const existingUser = await authRepository.getLegacyByEmail(email);

  if (existingUser && existingUser.status === 'active') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Este e-mail já possui uma conta ativa no sistema.',
    });
  }

  const jwtSecret = process.env.JWT_INVITE_SECRET || 'secret-chave-civix';
  const inviteToken = jwt.sign({ email, role }, jwtSecret, { expiresIn: '24h' });

  await authRepository.saveInvite(email, role, inviteToken, !!existingUser);
  await sendInviteEmail({ email, role, token: inviteToken });
}