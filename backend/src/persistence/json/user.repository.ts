import type { UserRepository } from '../../repositories/user.repository.js';
import { readLocalData, updateLocalData } from './local.store.js';

export const userJsonRepository: UserRepository = {
  async getById(id) {
    return (await readLocalData()).users.find(user => String(user.id) === String(id));
  },

  async getByEmail(email) {
    return (await readLocalData()).users.find(user => user.email === email);
  },

  async getByEmailAndRole(email, role) {
    return (await readLocalData()).users.find(user => user.email === email && user.role === role);
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