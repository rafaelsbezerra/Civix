import type { User } from '../../entities/user.entity.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import { db } from '../../shared/config/data.js';

export const userPostgresRepository: UserRepository = {
  async getById(id) {
    return (await db.query<User>('SELECT * FROM users WHERE id = $1', [id])).rows[0];
  },

  async getByEmail(email) {
    return (await db.query<Pick<User, 'id' | 'name' | 'email'>>('SELECT id, name, email FROM users WHERE email = $1', [email])).rows[0];
  },

  async getByEmailAndRole(email, role) {
    const query = role === 'empresa' ? `
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = $1 AND role = 'empresa'
      ` : `
        SELECT id, name, email, role
        FROM users
        WHERE email = $1 AND role = 'cliente'
      `;

    return (await db.query<User>(query, [email])).rows[0];
  },

  async getByValidResetTokenHash(tokenHash) {
    return (await db.query<Pick<User, 'id'>>(`
      SELECT id
      FROM users
      WHERE reset_password_token = $1
      AND reset_password_expires > NOW()
    `, [tokenHash])).rows[0];
  },

  async savePasswordResetToken(id, tokenHash, expiresAt) {
    await db.query(`
      UPDATE users
      SET reset_password_token = $1, reset_password_expires = $2
      WHERE id = $3
    `, [tokenHash, expiresAt, id]);
  },

  async updatePasswordAndClearResetToken(id, passwordHash) {
    await db.query(`
      UPDATE users
      SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL
      WHERE id = $2
    `, [passwordHash, id]);
  },

  async assignPlan(id, planId) {
    const result = await db.query(
      'UPDATE users SET plan_id = $1 WHERE id = $2 RETURNING id',
      [planId, id],
    );

    return result.rowCount === 1;
  },
};