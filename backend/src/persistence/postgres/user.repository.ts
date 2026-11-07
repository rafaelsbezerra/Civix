import type { User } from '../../entities/user.entity.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import { db } from '../../shared/config/data.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { randomUUID } from 'node:crypto';

function normalizeUserStatus(status?: string | null): string | undefined {
  if (status == null) {
    return undefined;
  }

  return status.toLowerCase();
}

function normalizeUser<T extends { status?: string }>(
  user: T | undefined,
): T | undefined {
  if (!user) {
    return undefined;
  }

  return {
    ...user,
    status: normalizeUserStatus(user.status),
  };
}

export const userPostgresRepository: UserRepository = {
  async getUsersForAdministration(companyId, filters) {
    const values: unknown[] = [];
    const where = ['deleted_at IS NULL'];
    if (companyId === null) {
      where.push("role='super_admin' AND company_id IS NULL");
    } else {
      values.push(companyId);
      where.push("company_id=$1 AND role IN ('admin_empresa','atendente')");
    }
    if (filters.q) {
      values.push('%' + filters.q.replace(/[\\%_]/g, '\\$&') + '%');
      where.push(
        '(email ILIKE $' +
          values.length +
          " OR COALESCE(name,'') ILIKE $" +
          values.length +
          ')',
      );
    }
    if (filters.role) {
      values.push(filters.role);
      where.push('role=$' + values.length);
    }
    if (filters.status) {
      values.push(filters.status.toUpperCase());
      where.push("COALESCE(status::text,'ACTIVE')=UPPER($" + values.length + ')');
    }
    values.push(filters.pageSize, filters.offset);
    const query =
      'WITH filtered AS (SELECT * FROM users WHERE ' +
      where.join(' AND ') +
      ') SELECT (SELECT COUNT(*)::int FROM filtered) AS total, ' +
      'COALESCE((SELECT json_agg(page_rows) FROM (SELECT * FROM filtered ORDER BY email,id LIMIT $' +
      (values.length - 1) +
      ' OFFSET $' +
      values.length +
      ") page_rows),'[]'::json) AS items";
    const result = (await db.query<{ items: User[]; total: number }>(query, values))
      .rows[0];

    return {
      total: result.total,
      items: result.items.map((item) => normalizeUser(item)!),
    };
  },
  async changeUserAdministration(input) {
    try {
      return await db.transaction(async (client) => {
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration',0))",
        );
        const actor = normalizeUser(
          (
            await client.query<User>('SELECT * FROM users WHERE id=$1 FOR UPDATE', [
              input.actorId,
            ])
          ).rows[0],
        );
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
          const company = (
            await client.query<{ status: string; deleted_at: string | null }>(
              'SELECT status,deleted_at FROM companies WHERE id=$1 FOR SHARE',
              [input.companyId],
            )
          ).rows[0];
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
        const user = normalizeUser(
          input.action === 'invite'
            ? (
                await client.query<User>(
                  'SELECT * FROM users WHERE LOWER(email)=LOWER($1) FOR UPDATE',
                  [input.email],
                )
              ).rows[0]
            : (
                await client.query<User>('SELECT * FROM users WHERE id=$1 FOR UPDATE', [
                  input.userId,
                ])
              ).rows[0],
        );
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
            return normalizeUser(
              (
                await client.query<User>(
                  'UPDATE users SET invite_token=$1,name=COALESCE($2,name) WHERE id=$3 RETURNING *',
                  [input.token, input.name ?? null, user.id],
                )
              ).rows[0],
            )!;
          }
          return normalizeUser(
            (
              await client.query<User>(
                "INSERT INTO users (id,email,name,role,company_id,status,invite_token) VALUES ($1,$2,$3,$4,$5,'PENDING',$6) RETURNING *",
                [
                  randomUUID(),
                  input.email,
                  input.name ?? null,
                  input.role,
                  input.companyId,
                  input.token,
                ],
              )
            ).rows[0],
          )!;
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
        const updates: Record<string, unknown> = {};
        const revoke = () => {
          updates.tokens_revoked_at = new Date(
            Math.max(
              Date.now(),
              user.tokens_revoked_at
                ? new Date(user.tokens_revoked_at).getTime() + 2
                : 0,
            ),
          ).toISOString();
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
          updates.name = input.name;
          if (input.companyId !== null) {
            updates.role = input.role;
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
            const active = await client.query(
              "SELECT id FROM users WHERE role='super_admin' AND company_id IS NULL AND deleted_at IS NULL AND password_hash IS NOT NULL AND UPPER(COALESCE(status::text,'ACTIVE'))='ACTIVE' FOR UPDATE",
            );
            if (
              !!user.password_hash &&
              (user.status == null || user.status.toLowerCase() === 'active') &&
              active.rows.length <= 1
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
            updates.deleted_at = new Date().toISOString();
          }
        }
        const entries = Object.entries(updates);
        const values = entries.map(([, value]) => value);
        values.push(user.id);
        const assignments = entries.map(([key], index) => {
          const parameter = '$' + (index + 1);
          return (
            key +
            (key === 'tokens_revoked_at'
              ? '=GREATEST(' +
                parameter +
                "::timestamptz,date_trunc('milliseconds',clock_timestamp()),COALESCE(tokens_revoked_at,'epoch'::timestamptz)+INTERVAL '2 milliseconds')"
              : '=' + parameter)
          );
        });
        return normalizeUser(
          (
            await client.query<User>(
              'UPDATE users SET ' +
                assignments.join(',') +
                ' WHERE id=$' +
                values.length +
                ' RETURNING *',
              values,
            )
          ).rows[0],
        )!;
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'E-mail já cadastrado.',
        });
      }
      throw error;
    }
  },
  async updateOwnProfile(id, input) {
    try {
      return normalizeUser(
        (
          await db.query<User>(
            `UPDATE users SET name=$1,email=$2,
        tokens_revoked_at=CASE WHEN LOWER(email)<>LOWER($2) THEN GREATEST($4::timestamptz,date_trunc('milliseconds',clock_timestamp()),COALESCE(tokens_revoked_at,'epoch'::timestamptz)+INTERVAL '2 milliseconds') ELSE tokens_revoked_at END,
        invite_token=CASE WHEN LOWER(email)<>LOWER($2) THEN NULL ELSE invite_token END,
        reset_password_token=CASE WHEN LOWER(email)<>LOWER($2) THEN NULL ELSE reset_password_token END,
        reset_password_expires=CASE WHEN LOWER(email)<>LOWER($2) THEN NULL ELSE reset_password_expires END
        WHERE id=$3 AND deleted_at IS NULL AND UPPER(COALESCE(status::text,'ACTIVE'))='ACTIVE' RETURNING *`,
            [input.name, input.email, id, new Date().toISOString()],
          )
        ).rows[0],
      );
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'E-mail já cadastrado.',
        });
      }
      throw error;
    }
  },
  async create(user) {
    return normalizeUser(
      (
        await db.query<User>(
          'INSERT INTO users (id, email, name, role, company_id, status, password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
          [
            user.id,
            user.email,
            user.name ?? null,
            user.role,
            user.company_id ?? null,
            (user.status ?? 'active').toUpperCase(),
            user.password_hash ?? null,
          ],
        )
      ).rows[0],
    )!;
  },
  async getById(id) {
    return normalizeUser(
      (await db.query<User>('SELECT * FROM users WHERE id = $1', [id])).rows[0],
    );
  },

  async getByEmail(email) {
    return (
      await db.query<Pick<User, 'id' | 'name' | 'email'>>(
        'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)',
        [email],
      )
    ).rows[0];
  },

  async getForLogin(email) {
    return normalizeUser(
      (
        await db.query<User>('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [
          email,
        ])
      ).rows[0],
    );
  },
  async getByEmailAndRole(email, role) {
    return normalizeUser(
      (
        await db.query<User>(
          'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND role = $2',
          [email, role],
        )
      ).rows[0],
    );
  },

  async getByValidResetTokenHash(tokenHash) {
    return (
      await db.query<Pick<User, 'id'>>(
        `
      SELECT id
      FROM users
      WHERE reset_password_token = $1
      AND reset_password_expires > NOW()
    `,
        [tokenHash],
      )
    ).rows[0];
  },

  async savePasswordResetToken(id, tokenHash, expiresAt) {
    await db.query(
      `
      UPDATE users
      SET reset_password_token = $1, reset_password_expires = $2
      WHERE id = $3
    `,
      [tokenHash, expiresAt, id],
    );
  },

  async updatePasswordAndClearResetToken(id, passwordHash) {
    await db.query(
      `
      UPDATE users
      SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL
      WHERE id = $2
    `,
      [passwordHash, id],
    );
  },

  async assignPlan(id, planId) {
    const result = await db.query(
      'UPDATE users SET plan_id = $1 WHERE id = $2 RETURNING id',
      [planId, id],
    );

    return result.rowCount === 1;
  },
};
