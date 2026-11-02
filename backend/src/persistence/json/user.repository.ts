import type { UserRepository } from '../../repositories/user.repository.js';
import { readLocalData, updateLocalData } from './local.store.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';

export const userJsonRepository: UserRepository = {
  async create(user) {
    return updateLocalData(data => {
      if (data.users.some(item => item.email.toLowerCase() === user.email.toLowerCase())) {
        throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'E-mail já cadastrado.' });
      }
      data.users.push({ ...user, company_id: user.company_id ?? null });
      return user;
    });
  },
  async getForLogin(email) {
    return (await readLocalData()).users.find(user => user.email.toLowerCase() === email.toLowerCase());
  },
  async getById(id) {
    return (await readLocalData()).users.find(user => String(user.id) === String(id));
  },

  async getByEmail(email) {
    return (await readLocalData()).users.find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  async getByEmailAndRole(email, role) {
    return (await readLocalData()).users.find(user => user.email.toLowerCase() === email.toLowerCase() && user.role === role);
  },

  async getByValidResetTokenHash(tokenHash) {
    return (await readLocalData()).users.find(user => {
      return user.reset_password_token === tokenHash
        && !!user.reset_password_expires
        && new Date(user.reset_password_expires).getTime() > Date.now();
    });
  },

  async savePasswordResetToken(id, tokenHash, expiresAt) {
    await updateLocalData(data => {
      const user = data.users.find(user => String(user.id) === String(id));

      if (user) {
        user.reset_password_token = tokenHash;
        user.reset_password_expires = expiresAt.toISOString();
      }
    });
  },

  async updatePasswordAndClearResetToken(id, passwordHash) {
    await updateLocalData(data => {
      const user = data.users.find(user => String(user.id) === String(id));

      if (user) {
        user.password_hash = passwordHash;
        user.reset_password_token = null;
        user.reset_password_expires = null;
      }
    });
  },

  async assignPlan(id, planId) {
    return updateLocalData(data => {
      const user = data.users.find(user => String(user.id) === String(id));

      if (!user) {
        return false;
      }

      user.plan_id = planId;

      return true;
    });
  },
};
