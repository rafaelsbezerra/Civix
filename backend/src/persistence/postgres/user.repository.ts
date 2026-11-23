import type { UserRepository } from '../../repositories/user.repository.js';
import type { User, UserId, UserRole } from '../../entities/user.entity.js';
import type {
  Prisma,
  users,
  user_role,
  user_status,
} from '../../generated/prisma/client.js';
import { getPrisma } from '../../shared/config/prisma.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { randomUUID } from 'node:crypto';
import type {
  ManagedUsersMetrics,
  RoleUsersBreakdown,
  UserAdministrationChange,
  UserAdministrationFilters,
} from '../../dtos/user.auth.dto.js';

function mapUser(row: users): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? undefined,
    role: row.role.toLowerCase() as UserRole,
    password_hash: row.password_hash ?? undefined,
    status: row.status.toLowerCase(),
    company_id: row.company_id,
    invite_token: row.invite_token,
    deleted_at: row.deleted_at?.toISOString() ?? null,
    deactivation_reason: row.deactivation_reason,
    tokens_revoked_at: row.tokens_revoked_at,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function rethrowEmailConflict(error: unknown): never {
  const prismaError = error as { code?: string; meta?: { code?: string } };
  if (
    prismaError?.code === 'P2002' ||
    (prismaError?.code === 'P2010' && prismaError.meta?.code === '23505')
  ) {
    throw new AppError({
      status: 409,
      code: ErrorCode.CONFLICT,
      message: 'E-mail já cadastrado.',
    });
  }

  throw error;
}

export const userPostgresRepository: UserRepository = {
  async getUsersForAdministration(companyId, filters) {
    const prisma = getPrisma();
    const search = filters.q ? escapeLike(filters.q) : undefined;
    const scopedRoles: user_role[] =
      companyId === null ? ['SUPER_ADMIN'] : ['ADMIN_EMPRESA', 'ATENDENTE'];
    const where: Prisma.usersWhereInput = {
      company_id: companyId,
      deleted_at: null,
      role: { in: scopedRoles },
      ...(filters.role
        ? { AND: { role: filters.role.toUpperCase() as user_role } }
        : {}),
      ...(filters.status
        ? { status: filters.status.toUpperCase() as user_status }
        : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [rows, total] = await prisma.$transaction(
      [
        prisma.users.findMany({
          where,
          orderBy: [{ email: 'asc' }, { id: 'asc' }],
          take: filters.pageSize,
          skip: filters.offset,
        }),
        prisma.users.count({ where }),
      ],
      { isolationLevel: 'RepeatableRead' },
    );

    return { items: rows.map(mapUser), total };
  },
  async getManagedUsersMetrics() {
    const rows = await getPrisma().users.groupBy({
      by: ['role', 'status'],
      where: {
        deleted_at: null,
        role: { in: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'ATENDENTE'] },
      },
      _count: { _all: true },
    });

    const roles: Array<'super_admin' | 'admin_empresa' | 'atendente'> = [
      'super_admin',
      'admin_empresa',
      'atendente',
    ];

    const byRoleMap = new Map<
      'super_admin' | 'admin_empresa' | 'atendente',
      RoleUsersBreakdown
    >();
    for (const role of roles) {
      byRoleMap.set(role, {
        role,
        total: 0,
        active: 0,
        pending: 0,
        blocked: 0,
      });
    }

    let total = 0;
    let active = 0;
    let pending = 0;
    let blocked = 0;

    for (const row of rows) {
      const role = row.role.toLowerCase() as
        'super_admin' | 'admin_empresa' | 'atendente';
      const breakdown = byRoleMap.get(role);
      if (!breakdown) {
        continue;
      }
      const count = row._count._all;
      const status = row.status.toLowerCase();

      breakdown.total += count;
      total += count;

      if (status === 'pending') {
        breakdown.pending += count;
        pending += count;
      } else if (status === 'blocked') {
        breakdown.blocked += count;
        blocked += count;
      } else {
        breakdown.active += count;
        active += count;
      }
    }

    return {
      total,
      active,
      pending,
      blocked,
      byRole: roles.map((role) => byRoleMap.get(role)!),
    };
  },
  async changeUserAdministration(input) {
    try {
      return await getPrisma().$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration', 0))`;
        const [lockedActor] = await tx.$queryRaw<{ id: string }[]>`
          SELECT id
          FROM users WHERE id = ${String(input.actorId)}::uuid FOR UPDATE
        `;
        const actorRow = lockedActor
          ? await tx.users.findUnique({ where: { id: lockedActor.id } })
          : null;
        const actor = actorRow ? mapUser(actorRow) : undefined;
        if (
          !actor ||
          actor.role !== 'super_admin' ||
          actor.company_id !== null ||
          !actor.password_hash ||
          actor.deleted_at ||
          (actor.status != null && actor.status.toLowerCase() !== 'active')
        ) {
          throw new AppError({
            status: 403,
            code: ErrorCode.FORBIDDEN,
            message: 'Acesso administrativo alterado.',
          });
        }
        if (input.companyId !== null) {
          const [lockedCompany] = await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM companies WHERE id = ${input.companyId}::uuid FOR SHARE
          `;
          const company = lockedCompany
            ? await tx.companies.findUnique({
                where: { id: lockedCompany.id },
                select: { status: true, deleted_at: true },
              })
            : null;
          if (!company) {
            throw new AppError({
              status: 404,
              code: ErrorCode.NOT_FOUND,
              message: 'Empresa não encontrada.',
            });
          }
          if (company.deleted_at || company.status.toLowerCase() === 'inativo') {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'Empresa indisponível para gestão de acessos.',
            });
          }
        }
        const [lockedUser] =
          input.action === 'invite'
            ? await tx.$queryRaw<{ id: string }[]>`
                SELECT id
                FROM users WHERE LOWER(email) = LOWER(${input.email ?? null}) FOR UPDATE
              `
            : await tx.$queryRaw<{ id: string }[]>`
                SELECT id
                FROM users WHERE id = ${input.userId == null ? null : String(input.userId)}::uuid FOR UPDATE
              `;
        const userRow = lockedUser
          ? await tx.users.findUnique({ where: { id: lockedUser.id } })
          : null;
        const user = userRow ? mapUser(userRow) : undefined;
        if (input.action === 'invite') {
          if (
            user &&
            (user.deleted_at ||
              user.status?.toLowerCase() !== 'pending' ||
              user.company_id !== input.companyId ||
              user.role !== input.role)
          ) {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'E-mail já possui conta; convite não altera perfil ou vínculo.',
            });
          }
          if (
            user?.tokens_revoked_at &&
            (!input.tokenIssuedAt ||
              !Number.isFinite(Date.parse(input.tokenIssuedAt)) ||
              Date.parse(input.tokenIssuedAt) <=
                new Date(user.tokens_revoked_at).getTime())
          ) {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'Convite alterado por outra operação. Tente reenviar.',
            });
          }
          if (user) {
            return mapUser(
              await tx.users.update({
                where: { id: String(user.id) },
                data: { invite_token: input.token, name: input.name ?? undefined },
              }),
            );
          }
          return mapUser(
            await tx.users.create({
              data: {
                id: randomUUID(),
                email: input.email!,
                name: input.name ?? null,
                role: input.role!.toUpperCase() as user_role,
                company_id: input.companyId,
                status: 'PENDING',
                invite_token: input.token,
              },
            }),
          );
        }
        if (
          !user ||
          user.deleted_at ||
          (input.companyId === null
            ? user.role !== 'super_admin' || user.company_id !== null
            : user.company_id !== input.companyId ||
              !['admin_empresa', 'atendente'].includes(user.role))
        ) {
          throw new AppError({
            status: 404,
            code: ErrorCode.NOT_FOUND,
            message: 'Usuário não encontrado neste contexto.',
          });
        }
        const updates: Prisma.usersUncheckedUpdateInput = {};
        let revokeTokens = false;
        const revoke = () => {
          revokeTokens = true;
          updates.invite_token = null;
          updates.reset_password_token = null;
          updates.reset_password_expires = null;
        };
        if (input.action === 'update') {
          if (
            input.companyId !== null &&
            !['admin_empresa', 'atendente'].includes(input.role || '')
          ) {
            throw new AppError({
              status: 400,
              code: ErrorCode.VALIDATION_ERROR,
              message: 'Perfil empresarial inválido.',
            });
          }
          if (
            user.email.toLowerCase() !== input.email!.toLowerCase() ||
            (input.role && user.role !== input.role)
          ) {
            revoke();
          }
          updates.email = input.email;
          updates.name = input.name ?? null;
          if (input.companyId !== null && input.role) {
            updates.role = input.role.toUpperCase() as user_role;
          }
        } else if (input.action === 'reactivate') {
          if (String(user.id) === String(actor.id)) {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'Não é possível reativar a própria conta por esta operação.',
            });
          }
          if (user.status?.toLowerCase() !== 'blocked') {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'Usuário não está desativado.',
            });
          }
          updates.status = user.password_hash ? 'ACTIVE' : 'PENDING';
          updates.invite_token = null;
        } else {
          if (!input.reason?.trim()) {
            throw new AppError({
              status: 400,
              code: ErrorCode.VALIDATION_ERROR,
              message: 'Motivo obrigatório.',
            });
          }
          if (input.companyId === null) {
            if (String(user.id) === String(actor.id)) {
              throw new AppError({
                status: 409,
                code: ErrorCode.CONFLICT,
                message: 'Não é permitido desativar a própria conta.',
              });
            }
            const active = await tx.$queryRaw<{ id: string }[]>`
              SELECT id FROM users
              WHERE role = 'SUPER_ADMIN' AND company_id IS NULL AND deleted_at IS NULL
                AND password_hash IS NOT NULL AND status = 'ACTIVE'
              FOR UPDATE
            `;
            if (
              !!user.password_hash &&
              (user.status == null || user.status.toLowerCase() === 'active') &&
              active.length <= 1
            ) {
              throw new AppError({
                status: 409,
                code: ErrorCode.CONFLICT,
                message: 'Não é permitido desativar o último superadmin ativo.',
              });
            }
          }
          if (input.action === 'delete' && user.role !== 'atendente') {
            throw new AppError({
              status: 400,
              code: ErrorCode.VALIDATION_ERROR,
              message: 'Somente atendentes podem ser excluídos.',
            });
          }
          updates.status = 'BLOCKED';
          updates.deactivation_reason = input.reason;
          revoke();
          if (input.action === 'delete') {
            updates.deleted_at = new Date();
          }
        }
        const id = String(user.id);
        if (revokeTokens) {
          await tx.$executeRaw`
            UPDATE users
            SET tokens_revoked_at = GREATEST(
              ${new Date()}::timestamptz,
              date_trunc('milliseconds', clock_timestamp()),
              COALESCE(tokens_revoked_at, 'epoch'::timestamptz) + INTERVAL '2 milliseconds'
            )
            WHERE id = ${id}::uuid
          `;
        }
        return mapUser(await tx.users.update({ where: { id }, data: updates }));
      });
    } catch (error) {
      rethrowEmailConflict(error);
    }
  },
  async updateOwnProfile(id, input) {
    try {
      const [row] = await getPrisma().$queryRaw<users[]>`
        UPDATE users SET
          name = ${input.name},
          email = ${input.email},
          tokens_revoked_at = CASE WHEN LOWER(email) <> LOWER(${input.email})
            THEN GREATEST(
              ${new Date()}::timestamptz,
              date_trunc('milliseconds', clock_timestamp()),
              COALESCE(tokens_revoked_at, 'epoch'::timestamptz) + INTERVAL '2 milliseconds'
            )
            ELSE tokens_revoked_at
          END,
          invite_token = CASE WHEN LOWER(email) <> LOWER(${input.email}) THEN NULL ELSE invite_token END,
          reset_password_token = CASE WHEN LOWER(email) <> LOWER(${input.email}) THEN NULL ELSE reset_password_token END,
          reset_password_expires = CASE WHEN LOWER(email) <> LOWER(${input.email}) THEN NULL ELSE reset_password_expires END,
          updated_at = NOW()
        WHERE id = ${String(id)}::uuid AND deleted_at IS NULL AND status = 'ACTIVE'
        RETURNING *, created_at AS "createdAt", updated_at AS "updatedAt"
      `;
      return row ? mapUser(row) : undefined;
    } catch (error) {
      rethrowEmailConflict(error);
    }
  },
  async create(user) {
    const row = await getPrisma().users.create({
      data: {
        id: String(user.id),
        email: user.email,
        name: user.name ?? null,
        role: user.role.toUpperCase() as user_role,
        company_id: user.company_id ?? null,
        status: (user.status ?? 'active').toUpperCase() as user_status,
        password_hash: user.password_hash ?? null,
      },
    });
    return mapUser(row);
  },
  async getById(id) {
    const row = await getPrisma().users.findUnique({ where: { id: String(id) } });
    return row ? mapUser(row) : undefined;
  },
  async getByEmail(email) {
    const row = await getPrisma().users.findFirst({
      where: { email: { equals: escapeLike(email), mode: 'insensitive' } },
      select: { id: true, name: true, email: true },
    });
    return row ? { ...row, name: row.name ?? undefined } : undefined;
  },
  async getForLogin(email) {
    const row = await getPrisma().users.findFirst({
      where: { email: { equals: escapeLike(email), mode: 'insensitive' } },
    });
    return row ? mapUser(row) : undefined;
  },
  async getByEmailAndRole(email, role) {
    const row = await getPrisma().users.findFirst({
      where: {
        email: { equals: escapeLike(email), mode: 'insensitive' },
        role: role.toUpperCase() as user_role,
      },
    });
    return row ? mapUser(row) : undefined;
  },
  async getByValidResetTokenHash(tokenHash) {
    const [row] = await getPrisma().$queryRaw<Pick<User, 'id'>[]>`
      SELECT id FROM users
      WHERE reset_password_token = ${tokenHash} AND reset_password_expires > NOW()
    `;
    return row;
  },
  async savePasswordResetToken(id, tokenHash, expiresAt) {
    await getPrisma().users.updateMany({
      where: { id: String(id) },
      data: { reset_password_token: tokenHash, reset_password_expires: expiresAt },
    });
  },
  async updatePasswordAndClearResetToken(id, passwordHash) {
    await getPrisma().users.updateMany({
      where: { id: String(id) },
      data: {
        password_hash: passwordHash,
        reset_password_token: null,
        reset_password_expires: null,
      },
    });
  },
  async assignPlan(id, planId) {
    const { count } = await getPrisma().users.updateMany({
      where: { id: String(id) },
      data: { plan_id: BigInt(planId) },
    });
    return count === 1;
  },
};
