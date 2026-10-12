import { randomUUID } from 'node:crypto';
import type { AuthRepository } from '../../repositories/auth.repository.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { readLocalData, updateLocalData } from './local.store.js';

export const authJsonRepository: AuthRepository = {
  async getByResetToken(token) {
    const user = (await readLocalData()).users.find(user => user.reset_password_token === token);

    return user ? {
      email: user.email,
      reset_password_expires: user.reset_password_expires ?? null,
    } : undefined;
  },

  async getInviteUserByEmail(email, role) {
    const users = (await readLocalData()).users.filter(user => user.email === email);

    if (role !== undefined) {
      return users.find(user => user.role === role);
    }

    // Usuários anteriores sem status mantêm o comportamento de conta ativa.
    return users.find(user => user.status === 'active' || user.status == null) ?? users[0];
  },

  async activateUser(id, passwordHash, token) {
    return updateLocalData(data => {
      const user = data.users.find(user => String(user.id) === String(id)
        && user.invite_token === token && user.status !== 'active');

      if (!user) {
        return false;
      }

      user.password_hash = passwordHash;
      user.status = 'active';
      user.invite_token = null;

      return true;
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

  async saveInvite(email, role, token, existingId) {
    await updateLocalData(data => {
      if (existingId !== undefined) {
        const user = data.users.find(user => String(user.id) === String(existingId));

        if (!user) {
          throw new AppError({
            status: 404,
            code: ErrorCode.NOT_FOUND,
            message: 'Usuário não encontrado.',
          });
        }

        if (user.status === 'active' || user.status == null) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'Não foi possível atualizar o convite. A conta foi alterada; tente novamente.',
          });
        }

        user.role = role;
        user.status = 'pending';
        user.invite_token = token;
      } else {
        data.users.push({
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
