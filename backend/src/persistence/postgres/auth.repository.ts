import type { User } from '../../entities/user.entity.js';
import type { UserRow } from '../../interfaces/auth.user.row.js';
import type { AuthRepository } from '../../repositories/auth.repository.js';
import { db } from '../../shared/config/data.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';

export const authPostgresRepository: AuthRepository = {
  async getInviteUserByEmail(email, role) {
    const query = role === undefined
      ? 'SELECT * FROM users WHERE email = $1'
      : 'SELECT * FROM users WHERE email = $1 AND role = $2';
    const values = role === undefined ? [email] : [email, role];
    const { rows } = await db.query<UserRow>(query, values);

    if (role !== undefined) {
      return rows[0];
    }

    // Preservar contas ativas ao verificar reconvites para o mesmo e-mail.
    return rows.find(user => user.status === 'active' || user.status == null) ?? rows[0];
  },

  async activateUser(id, passwordHash, token) {
    const result = await db.query(
      `UPDATE users
       SET password_hash = $1, status = $2, invite_token = $3
       WHERE id = $4 AND invite_token = $5 AND status IS DISTINCT FROM 'active'
       RETURNING id`,
      [passwordHash, 'active', null, id, token],
    );

    return result.rowCount === 1;
  },

  async getResetUserByEmail(email) {
    return (await db.query<User>('SELECT * FROM users WHERE email = $1', [email])).rows[0];
  },

  async saveResetToken(id, token) {
    await db.query('UPDATE users SET reset_password_token = $1 WHERE id = $2', [token, id]);
  },

  async saveInvite(email, role, token, existingId) {
    if (existingId !== undefined) {
      const result = await db.query(
        `UPDATE users
         SET role = $1, status = $2, invite_token = $3
         WHERE id = $4 AND status IS NOT NULL AND status <> 'active'
         RETURNING id`,
        [role, 'pending', token, existingId],
      );

      if (result.rowCount !== 1) {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Não foi possível atualizar o convite. A conta foi alterada; tente novamente.',
        });
      }

      return;
    }

    await db.query(
      `INSERT INTO users (email, role, status, invite_token)
       VALUES ($1, $2, $3, $4)`,
      [email, role, 'pending', token],
    );
  },
};
