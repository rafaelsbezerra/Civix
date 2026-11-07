import { randomUUID } from 'node:crypto';
import type { AuthRepository } from '../../repositories/auth.repository.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { readLocalData, updateLocalData } from './local.store.js';

export const authJsonRepository: AuthRepository = {
  async getInviteUserByEmail(email, role) {
    const users = (await readLocalData()).users.filter(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );

    if (role !== undefined) {
      return users.find((user) => user.role === role);
    }

    // Usuários anteriores sem status mantêm o comportamento de conta ativa.
    return (
      users.find((user) => user.status === 'active' || user.status == null) ?? users[0]
    );
  },

  async activateUser(id, passwordHash, token) {
    return updateLocalData((data) => {
      const user = data.users.find(
        (user) =>
          String(user.id) === String(id) &&
          !user.deleted_at &&
          user.invite_token === token &&
          user.status === 'pending',
      );

      if (!user) {
        return false;
      }
      if (user.role !== 'super_admin') {
        const company = data.companies.find((item) => item.id === user.company_id);
        if (
          !company ||
          company.deleted_at ||
          company.status === 'inativo' ||
          !['admin_empresa', 'atendente'].includes(user.role)
        ) {
          return false;
        }
      } else if (user.company_id !== null) {
        return false;
      }

      user.password_hash = passwordHash;
      user.status = 'active';
      user.invite_token = null;

      return true;
    });
  },

  async getResetUserByEmail(email) {
    return (await readLocalData()).users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  },

  async saveResetToken(id, token) {
    await updateLocalData((data) => {
      const user = data.users.find((user) => String(user.id) === String(id));

      if (user) {
        user.reset_password_token = token;
      }
    });
  },

  async saveInvite(email, role, token, existingId, companyId, issuedAt) {
    await updateLocalData((data) => {
      const company = data.companies.find((item) => item.id === companyId);
      if (!company || company.deleted_at || company.status === 'inativo') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Empresa indisponível para convite.',
        });
      }
      if (existingId !== undefined) {
        const user = data.users.find((user) => String(user.id) === String(existingId));

        if (!user) {
          throw new AppError({
            status: 404,
            code: ErrorCode.NOT_FOUND,
            message: 'Usuário não encontrado.',
          });
        }

        if (
          user.deleted_at ||
          user.status !== 'pending' ||
          user.role !== role ||
          user.company_id !== companyId ||
          (user.tokens_revoked_at &&
            (!issuedAt ||
              !Number.isFinite(Date.parse(issuedAt)) ||
              Date.parse(issuedAt) <= Date.parse(user.tokens_revoked_at)))
        ) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message:
              'Não foi possível atualizar o convite. A conta foi alterada; tente novamente.',
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
          company_id: companyId ?? null,
        });
      }
    });
  },
};
