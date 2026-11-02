import { logger } from '../shared/logging/log.context.js';
import jwt from 'jsonwebtoken';
import { isAuthenticatedRole, type UserRole } from '../entities/user.entity.js';
import { authRepository } from '../persistence/auth.repository.js';
import { companyRepository } from '../persistence/company.repository.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { sendInviteEmail } from './mail.service.js';

export async function inviteUser(email: string, role: UserRole, companyId?: string | null): Promise<void> {
  if (!isAuthenticatedRole(role) || role === 'super_admin' || !companyId) {
    throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'Convite exige perfil empresarial e empresa.' });
  }
  const company = await companyRepository.getById(companyId);
  if (!company || company.status === 'inativo') {
    throw new AppError({ status: 404, code: ErrorCode.NOT_FOUND, message: 'Empresa não encontrada ou indisponível.' });
  }
  const existing = await authRepository.getInviteUserByEmail(email);
  if (existing && existing.status !== 'pending') {
    throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'E-mail já possui uma conta; convite não altera seus acessos.' });
  }
  if (existing && (existing.role !== role || existing.company_id !== companyId)) {
    throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'Convite não pode transferir perfil ou empresa.' });
  }
  const secret = process.env.JWT_INVITE_SECRET;
  if (!secret) throw new AppError({ status: 500, code: ErrorCode.INTERNAL_ERROR, message: 'Erro interno do servidor' });
  const token = jwt.sign({ email, role, companyId, purpose: 'invite' }, secret, { expiresIn: '24h' });
  await authRepository.saveInvite(email.toLowerCase(), role, token, existing?.id, companyId);
  logger().info({ event: 'admin.invite.prepared', module: 'admin', message: 'Convite preparado',
    context: { userId: existing?.id, role, companyId } });
  await sendInviteEmail({ email, role, token });
}
