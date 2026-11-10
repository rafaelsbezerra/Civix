import type { UserRepository } from '../../repositories/user.repository.js';
import type { RoleUsersBreakdown } from '../../dtos/user.auth.dto.js';
import { readLocalData, updateLocalData } from './local.store.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { randomUUID } from 'node:crypto';

export const userJsonRepository: UserRepository = {
  async getUsersForAdministration(companyId, filters) {
    const rows = (await readLocalData()).users
      .filter(
        (user) =>
          !user.deleted_at &&
          (companyId === null
            ? user.role === 'super_admin' && user.company_id === null
            : user.company_id === companyId &&
              ['admin_empresa', 'atendente'].includes(user.role)) &&
          (!filters.q ||
            (user.email + ' ' + (user.name || ''))
              .toLowerCase()
              .includes(filters.q.toLowerCase())) &&
          (!filters.role || user.role === filters.role) &&
          (!filters.status || (user.status || 'active') === filters.status),
      )
      .sort(
        (a, b) =>
          a.email.localeCompare(b.email) || String(a.id).localeCompare(String(b.id)),
      );
    return {
      items: rows.slice(filters.offset, filters.offset + filters.pageSize),
      total: rows.length,
    };
  },
  async getManagedUsersMetrics() {
    const data = await readLocalData();
    const roles: Array<'super_admin' | 'admin_empresa' | 'atendente'> = [
      'super_admin',
      'admin_empresa',
      'atendente',
    ];

    const byRoleMap = new Map<
      'super_admin' | 'admin_empresa' | 'atendente',
      RoleUsersBreakdown
    >();
    for (const role of roles) {
      byRoleMap.set(role, {
        role,
        total: 0,
        active: 0,
        pending: 0,
        blocked: 0,
      });
    }

    let total = 0;
    let active = 0;
    let pending = 0;
    let blocked = 0;

    for (const user of data.users) {
      if (user.deleted_at) {
        continue;
      }
      const role = user.role.toLowerCase() as
        'super_admin' | 'admin_empresa' | 'atendente';
      const breakdown = byRoleMap.get(role);
      if (!breakdown) {
        continue;
      }
      const status = (user.status || 'active').toLowerCase();

      breakdown.total += 1;
      total += 1;

      if (status === 'pending') {
        breakdown.pending += 1;
        pending += 1;
      } else if (status === 'blocked') {
        breakdown.blocked += 1;
        blocked += 1;
      } else {
        breakdown.active += 1;
        active += 1;
      }
    }

    return {
      total,
      active,
      pending,
      blocked,
      byRole: roles.map((role) => byRoleMap.get(role)!),
    };
  },
  async changeUserAdministration(input) {
    return updateLocalData((data) => {
      const actor = data.users.find(
        (user) => String(user.id) === String(input.actorId),
      );
      if (
        !actor ||
        actor.role !== 'super_admin' ||
        actor.company_id !== null ||
        !actor.password_hash ||
        actor.deleted_at ||
        (actor.status != null && actor.status !== 'active')
      ) {
        throw new AppError({
          status: 403,
          code: ErrorCode.FORBIDDEN,
          message: 'Acesso administrativo alterado.',
        });
      }
      if (input.companyId !== null) {
        const company = data.companies.find((item) => item.id === input.companyId);
        if (!company) {
          throw new AppError({
            status: 404,
            code: ErrorCode.NOT_FOUND,
            message: 'Empresa não encontrada.',
          });
        }
        if (company.deleted_at || company.status === 'inativo') {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'Empresa indisponível para gestão de acessos.',
          });
        }
      }
      let user =
        input.action === 'invite'
          ? data.users.find(
              (item) => item.email.toLowerCase() === input.email!.toLowerCase(),
            )
          : data.users.find((item) => String(item.id) === String(input.userId));
      if (input.action === 'invite') {
        if (
          user &&
          (user.deleted_at ||
            user.status !== 'pending' ||
            user.company_id !== input.companyId ||
            user.role !== input.role)
        ) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'E-mail já possui conta; convite não altera perfil ou vínculo.',
          });
        }
        if (
          user?.tokens_revoked_at &&
          (!input.tokenIssuedAt ||
            !Number.isFinite(Date.parse(input.tokenIssuedAt)) ||
            Date.parse(input.tokenIssuedAt) <= Date.parse(user.tokens_revoked_at))
        ) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'Convite alterado por outra operação. Tente reenviar.',
          });
        }
        if (!user) {
          user = {
            id: randomUUID(),
            email: input.email!,
            role: input.role!,
            company_id: input.companyId,
            status: 'pending',
          };
          data.users.push(user);
        }
        user.invite_token = input.token;
        if (input.name !== undefined) {
          user.name = input.name;
        }
        return user;
      }
      if (
        !user ||
        user.deleted_at ||
        (input.companyId === null
          ? user.role !== 'super_admin' || user.company_id !== null
          : user.company_id !== input.companyId ||
            !['admin_empresa', 'atendente'].includes(user.role))
      ) {
        throw new AppError({
          status: 404,
          code: ErrorCode.NOT_FOUND,
          message: 'Usuário não encontrado neste contexto.',
        });
      }
      const revoke = () => {
        user!.tokens_revoked_at = new Date(
          Math.max(Date.now(), Date.parse(user!.tokens_revoked_at || '1970-01-01') + 2),
        ).toISOString();
        user!.invite_token = null;
        user!.reset_password_token = null;
        user!.reset_password_expires = null;
      };
      if (input.action === 'update') {
        if (
          data.users.some(
            (item) =>
              String(item.id) !== String(user!.id) &&
              item.email.toLowerCase() === input.email!.toLowerCase(),
          )
        ) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'E-mail já cadastrado.',
          });
        }
        if (
          input.companyId !== null &&
          !['admin_empresa', 'atendente'].includes(input.role || '')
        ) {
          throw new AppError({
            status: 400,
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Perfil empresarial inválido.',
          });
        }
        if (
          user.email.toLowerCase() !== input.email!.toLowerCase() ||
          (input.role && user.role !== input.role)
        ) {
          revoke();
        }
        user.email = input.email!;
        user.name = input.name;
        if (input.companyId !== null) {
          user.role = input.role!;
        }
      } else if (input.action === 'reactivate') {
        if (String(user.id) === String(actor.id)) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'Não é possível reativar a própria conta por esta operação.',
          });
        }
        if (user.status !== 'blocked') {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'Usuário não está desativado.',
          });
        }
        user.status = user.password_hash ? 'active' : 'pending';
        user.invite_token = null;
      } else {
        if (!input.reason?.trim()) {
          throw new AppError({
            status: 400,
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Motivo obrigatório.',
          });
        }
        if (input.companyId === null) {
          if (String(user.id) === String(actor.id)) {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'Não é permitido desativar a própria conta.',
            });
          }
          if (
            !!user.password_hash &&
            (user.status == null || user.status === 'active') &&
            data.users.filter(
              (item) =>
                item.role === 'super_admin' &&
                item.company_id === null &&
                !item.deleted_at &&
                !!item.password_hash &&
                (item.status == null || item.status === 'active'),
            ).length <= 1
          ) {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'Não é permitido desativar o último superadmin ativo.',
            });
          }
        }
        if (input.action === 'delete' && user.role !== 'atendente') {
          throw new AppError({
            status: 400,
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Somente atendentes podem ser excluídos.',
          });
        }
        user.status = 'blocked';
        user.deactivation_reason = input.reason;
        revoke();
        if (input.action === 'delete') {
          user.deleted_at = new Date().toISOString();
        }
      }
      return user;
    });
  },
  async updateOwnProfile(id, input) {
    return updateLocalData((data) => {
      const user = data.users.find((item) => String(item.id) === String(id));
      if (
        !user ||
        user.deleted_at ||
        (user.status != null && user.status !== 'active')
      ) {
        return undefined;
      }
      if (
        data.users.some(
          (item) =>
            String(item.id) !== String(id) &&
            item.email.toLowerCase() === input.email.toLowerCase(),
        )
      ) {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'E-mail já cadastrado.',
        });
      }
      if (user.email.toLowerCase() !== input.email.toLowerCase()) {
        user.tokens_revoked_at = new Date(
          Math.max(Date.now(), Date.parse(user.tokens_revoked_at || '1970-01-01') + 2),
        ).toISOString();
        user.invite_token = null;
        user.reset_password_token = null;
        user.reset_password_expires = null;
      }
      user.name = input.name;
      user.email = input.email;
      return user;
    });
  },
  async create(user) {
    return updateLocalData((data) => {
      if (
        data.users.some((item) => item.email.toLowerCase() === user.email.toLowerCase())
      ) {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'E-mail já cadastrado.',
        });
      }
      data.users.push({
        ...user,
        company_id: user.company_id ?? null,
        tokens_revoked_at: user.tokens_revoked_at
          ? new Date(user.tokens_revoked_at).toISOString()
          : user.tokens_revoked_at,
      });
      return user;
    });
  },
  async getForLogin(email) {
    return (await readLocalData()).users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  },
  async getById(id) {
    return (await readLocalData()).users.find((user) => String(user.id) === String(id));
  },

  async getByEmail(email) {
    return (await readLocalData()).users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  },

  async getByEmailAndRole(email, role) {
    return (await readLocalData()).users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.role === role,
    );
  },

  async getByValidResetTokenHash(tokenHash) {
    return (await readLocalData()).users.find((user) => {
      return (
        user.reset_password_token === tokenHash &&
        !!user.reset_password_expires &&
        new Date(user.reset_password_expires).getTime() > Date.now()
      );
    });
  },

  async savePasswordResetToken(id, tokenHash, expiresAt) {
    await updateLocalData((data) => {
      const user = data.users.find((user) => String(user.id) === String(id));

      if (user) {
        user.reset_password_token = tokenHash;
        user.reset_password_expires = expiresAt.toISOString();
      }
    });
  },

  async updatePasswordAndClearResetToken(id, passwordHash) {
    await updateLocalData((data) => {
      const user = data.users.find((user) => String(user.id) === String(id));

      if (user) {
        user.password_hash = passwordHash;
        user.reset_password_token = null;
        user.reset_password_expires = null;
      }
    });
  },

  async assignPlan(id, planId) {
    return updateLocalData((data) => {
      const user = data.users.find((user) => String(user.id) === String(id));

      if (!user) {
        return false;
      }

      user.plan_id = planId;

      return true;
    });
  },
};
