import type { User } from '../../entities/user.entity.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import { db } from '../../shared/config/data.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';

export const userPostgresRepository: UserRepository = {
  async updateOwnProfile(id, input) {
    try {
      return (await db.query<User>('UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
        [input.name, input.email, id])).rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'E-mail já cadastrado.' });
      }
      throw error;
    }
  },
  async create(user) {
    return (await db.query<User>(
      'INSERT INTO users (id, email, name, role, company_id, status, password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [user.id, user.email, user.name ?? null, user.role, user.company_id ?? null, user.status ?? 'active', user.password_hash ?? null],
    )).rows[0];
  },
  async getById(id) {
    return (await db.query<User>('SELECT * FROM users WHERE id = $1', [id])).rows[0];
  },

  async getByEmail(email) {
    return (await db.query<Pick<User, 'id' | 'name' | 'email'>>('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)', [email])).rows[0];
  },

  async getForLogin(email) {
    return (await db.query<User>('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email])).rows[0];
  },
  async getByEmailAndRole(email, role) {
    return (await db.query<User>('SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND role = $2', [email, role])).rows[0];
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
