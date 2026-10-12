import { randomUUID } from 'node:crypto';
import type { AuthRepository } from '../../repositories/auth.repository.js';
import { readLocalData, updateLocalData } from './local.store.js';

export const authJsonRepository: AuthRepository = {
  async getByResetToken(token) {
    const user = (await readLocalData()).users.find(user => user.reset_password_token === token);

    return user ? {
      email: user.email,
      reset_password_expires: user.reset_password_expires ?? null,
    } : undefined;
  },

  async getLegacyByEmail(email) {
    return (await readLocalData()).legacyUsers.find(user => user.email === email);
  },

  async activateLegacy(email, passwordHash) {
    await updateLocalData(data => {
      const user = data.legacyUsers.find(user => user.email === email);

      if (user) {
        user.password_hash = passwordHash;
        user.status = 'active';
        user.invite_token = null;
      }
    });
  },

  async getResetUserByEmail(email) {
    return (await readLocalData()).users.find(user => user.email === email);
  },

  async saveResetToken(id, token) {
    await updateLocalData(data => {
      const user = data.users.find(user => String(user.id) === String(id));

      if (user) {
        user.reset_password_token = token;
      }
    });
  },

  async saveInvite(email, role, token, existing) {
    await updateLocalData(data => {
      const user = data.legacyUsers.find(user => user.email === email);

      if (existing && user) {
        user.role = role;
        user.status = 'pending';
        user.invite_token = token;
      } else if (!existing) {
        data.legacyUsers.push({
          id: randomUUID(),
          email,
          role,
          status: 'pending',
          invite_token: token,
        });
      }
    });
  },
};