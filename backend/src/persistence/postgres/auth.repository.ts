import type { AuthRepository } from '../../repositories/auth.repository.js';
import type { User, UserId, UserRole } from '../../entities/user.entity.js';
import type { users, user_role } from '../../generated/prisma/client.js';
import type { UserRow } from '../../interfaces/auth.user.row.js';
import { getPrisma } from '../../shared/config/prisma.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';

function escapeEmailPattern(email: string): string {
  return email.replace(/[\\%_]/g, '\\$&');
}

function mapUser(row: users): User {
  return {
    ...row,
    name: row.name ?? undefined,
    password_hash: row.password_hash ?? undefined,
    role: row.role.toLowerCase() as UserRole,
    status: row.status.toLowerCase(),
    deleted_at: row.deleted_at?.toISOString() ?? null,
  };
}

export const authPostgresRepository: AuthRepository = {
  async getInviteUserByEmail(email, role) {
    const rows = await getPrisma().users.findMany({
      where: {
        email: { equals: escapeEmailPattern(email), mode: 'insensitive' },
        ...(role ? { role: role.toUpperCase() as user_role } : {}),
      },
    });
    const selected = role
      ? rows[0]
      : (rows.find((row) => row.status === 'ACTIVE') ?? rows[0]);
    return selected ? mapUser(selected) : undefined;
  },
  async activateUser(id, passwordHash, token) {
    return getPrisma().$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration', 0))`;
      const result = await tx.users.updateMany({
        where: {
          id: String(id),
          invite_token: token,
          status: 'PENDING',
          deleted_at: null,
          OR: [
            { role: 'SUPER_ADMIN', company_id: null },
            {
              role: { in: ['ADMIN_EMPRESA', 'ATENDENTE'] },
              companies: { is: { status: { not: 'INATIVO' }, deleted_at: null } },
            },
          ],
        },
        data: { password_hash: passwordHash, status: 'ACTIVE', invite_token: null },
      });
      return result.count === 1;
    });
  },
  async getResetUserByEmail(email) {
    const row = await getPrisma().users.findFirst({
      where: { email: { equals: escapeEmailPattern(email), mode: 'insensitive' } },
    });
    return row ? mapUser(row) : undefined;
  },
  async saveResetToken(id, token) {
    await getPrisma().users.updateMany({
      where: { id: String(id) },
      data: { reset_password_token: token },
    });
  },
  async saveInvite(email, role, token, existingId, companyId, issuedAt) {
    await getPrisma().$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration', 0))`;
      const rows = await tx.$queryRaw<
        { status: string; deleted_at: Date | null }[]
      >`SELECT status, deleted_at FROM companies WHERE id = ${companyId ?? null}::uuid FOR SHARE`;
      const company = rows[0];
      if (!company || company.deleted_at || company.status === 'INATIVO') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Empresa indisponível para convite.',
        });
      }
      const upperRole = role.toUpperCase() as user_role;
      if (existingId !== undefined) {
        const result = await tx.users.updateMany({
          where: {
            id: String(existingId),
            status: 'PENDING',
            company_id: companyId,
            role: upperRole,
            deleted_at: null,
            OR: [
              { tokens_revoked_at: null },
              ...(issuedAt ? [{ tokens_revoked_at: { lt: new Date(issuedAt) } }] : []),
            ],
          },
          data: { role: upperRole, status: 'PENDING', invite_token: token },
        });
        if (result.count !== 1) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message:
              'Não foi possível atualizar o convite. A conta foi alterada; tente novamente.',
          });
        }
        return;
      }
      await tx.users.create({
        data: {
          email,
          role: upperRole,
          status: 'PENDING',
          invite_token: token,
          company_id: companyId,
        },
      });
    });
  },
};
