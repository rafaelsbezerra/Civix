import type { User } from '../../entities/user.entity.js';
import type { UserRow } from '../../interfaces/auth.user.row.js';
import type { AuthRepository } from '../../repositories/auth.repository.js';
import { db } from '../../shared/config/data.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';

export const authPostgresRepository: AuthRepository = {
  async getInviteUserByEmail(email, role) {
    const query =
      role === undefined
        ? 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)'
        : 'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND role = $2';
    const values = role === undefined ? [email] : [email, role];
    const { rows } = await db.query<UserRow>(query, values);

    if (role !== undefined) {
      return rows[0];
    }

    // Preservar contas ativas ao verificar reconvites para o mesmo e-mail.
    return (
      rows.find((user) => user.status === 'active' || user.status == null) ?? rows[0]
    );
  },

  async activateUser(id, passwordHash, token) {
    return db.transaction(async (client) => {
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration',0))",
      );
      const result = await client.query(
        `UPDATE users
       SET password_hash = $1, status = $2, invite_token = $3
       WHERE id = $4 AND invite_token = $5 AND status = 'pending' AND deleted_at IS NULL
       AND ((role = 'super_admin' AND company_id IS NULL) OR
         (role IN ('admin_empresa','atendente') AND EXISTS
           (SELECT 1 FROM companies WHERE companies.id = users.company_id AND companies.status <> 'inativo' AND companies.deleted_at IS NULL)))
       RETURNING id`,
        [passwordHash, 'active', null, id, token],
      );

      return result.rowCount === 1;
    });
  },

  async getResetUserByEmail(email) {
    return (
      await db.query<User>('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [
        email,
      ])
    ).rows[0];
  },

  async saveResetToken(id, token) {
    await db.query('UPDATE users SET reset_password_token = $1 WHERE id = $2', [
      token,
      id,
    ]);
  },

  async saveInvite(email, role, token, existingId, companyId, issuedAt) {
    await db.transaction(async (client) => {
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration',0))",
      );
      const company = (
        await client.query<{ status: string; deleted_at: string | null }>(
          'SELECT status,deleted_at FROM companies WHERE id=$1 FOR SHARE',
          [companyId],
        )
      ).rows[0];
      if (!company || company.deleted_at || company.status === 'inativo') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Empresa indisponível para convite.',
        });
      }
      if (existingId !== undefined) {
        const result = await client.query(
          `UPDATE users
         SET role = $1, status = $2, invite_token = $3
         WHERE id = $4 AND status = 'pending' AND company_id = $5 AND role = $1 AND deleted_at IS NULL
         AND (tokens_revoked_at IS NULL OR tokens_revoked_at < $6::timestamptz)
         RETURNING id`,
          [role, 'pending', token, existingId, companyId, issuedAt ?? null],
        );

        if (result.rowCount !== 1) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message:
              'Não foi possível atualizar o convite. A conta foi alterada; tente novamente.',
          });
        }

        return;
      }

      await client.query(
        `INSERT INTO users (email, role, status, invite_token, company_id)
       VALUES ($1, $2, $3, $4, $5)`,
        [email, role, 'pending', token, companyId],
      );
    });
  },
};
