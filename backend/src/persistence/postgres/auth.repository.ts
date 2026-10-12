import type { User } from '../../entities/user.entity.js';
import type { UserRow, ResetTokenRow } from '../../interfaces/auth.user.row.js';
import type { AuthRepository } from '../../repositories/auth.repository.js';
import { db } from '../../shared/config/data.js';

export const authPostgresRepository: AuthRepository = {
  async getByResetToken(token) {
    const query = `
    SELECT email, reset_password_expires
    FROM users
    WHERE reset_password_token = $1
  `;

    return (await db.query<ResetTokenRow>(query, [token])).rows[0];
  },

  async getLegacyByEmail(email) {
    return (await db.query<UserRow>('SELECT * FROM "user" WHERE email = $1', [email])).rows[0];
  },

  async activateLegacy(email, passwordHash) {
    await db.query(
      `UPDATE "user"
     SET password_hash = $1, status = $2, invite_token = $3
     WHERE email = $4`,
      [passwordHash, 'active', null, email],
    );
  },

  async getResetUserByEmail(email) {
    return (await db.query<User>('SELECT * FROM users WHERE email = $1', [email])).rows[0];
  },

  async saveResetToken(id, token) {
    await db.query('UPDATE users SET reset_password_token = $1 WHERE id = $2', [token, id]);
  },

  async saveInvite(email, role, token, existing) {
    if (existing) {
      await db.query(
        `UPDATE "user"
       SET role = $1, status = $2, invite_token = $3
       WHERE email = $4`,
        [role, 'pending', token, email],
      );

      return;
    }

    await db.query(
      `INSERT INTO "user" (email, role, status, invite_token)
       VALUES ($1, $2, $3, $4)`,
      [email, role, 'pending', token],
    );
  },
};