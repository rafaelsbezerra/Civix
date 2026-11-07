import type { CompanyRepository } from '../../repositories/company.repository.js';
import { readLocalData, updateLocalData } from './local.store.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { createInitialSale } from '../../services/sale.service.js';
import { normalizePlanPrice } from '../../services/plan.service.js';

function createNameRegex(name: string): RegExp {
  // Mantém os curingas % e _ observados no ILIKE do PostgreSQL.
  const pattern = [...name]
    .map((character) => {
      if (character === '%') {
        return '.*';
      }

      if (character === '_') {
        return '.';
      }

      return character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(pattern, 'iu');
}

export const companyJsonRepository: CompanyRepository = {
  async listPlatformCompanies(filters) {
    const rows = (await readLocalData()).companies
      .filter(
        (company) =>
          (!filters.q ||
            (company.nome + ' ' + company.cnpj)
              .toLowerCase()
              .includes(filters.q.toLowerCase())) &&
          (!filters.planId || String(company.plan_id) === filters.planId) &&
          (!filters.status ||
            (filters.status === 'archived'
              ? !!company.deleted_at
              : !company.deleted_at &&
                (filters.status === 'ativo'
                  ? company.status !== 'inativo'
                  : company.status === 'inativo'))),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome) || a.id.localeCompare(b.id));
    return {
      items: rows.slice(filters.offset, filters.offset + filters.pageSize),
      total: rows.length,
    };
  },
  async changeCompanyAdministration(input) {
    return updateLocalData((data) => {
      const actor = data.users.find(
        (user) => String(user.id) === String(input.actorId),
      );
      if (
        !actor ||
        actor.role !== 'super_admin' ||
        actor.deleted_at ||
        (actor.status != null && actor.status !== 'active')
      ) {
        throw new AppError({
          status: 403,
          code: ErrorCode.FORBIDDEN,
          message: 'Acesso administrativo alterado.',
        });
      }
      const company = data.companies.find((item) => item.id === input.companyId);
      if (!company) {
        throw new AppError({
          status: 404,
          code: ErrorCode.NOT_FOUND,
          message: 'Empresa não encontrada.',
        });
      }
      if (input.action === 'restore') {
        if (!company.deleted_at) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'A empresa não está arquivada.',
          });
        }
        company.deleted_at = null;
        company.status = 'inativo';
        company.updatedAt = new Date().toISOString();
        return company;
      }
      if (company.deleted_at) {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Restaure a empresa antes de alterá-la.',
        });
      }
      if (input.action === 'update') {
        const fields = input.fields!;
        const plan = data.plans.find((item) => String(item.id) === fields.planId);
        if (!plan) {
          throw new AppError({
            status: 404,
            code: ErrorCode.NOT_FOUND,
            message: 'Plano não encontrado.',
          });
        }
        if (String(company.plan_id) !== String(plan.id)) {
          if (!plan.is_active) {
            throw new AppError({
              status: 400,
              code: ErrorCode.VALIDATION_ERROR,
              message: 'Plano inativo.',
            });
          }
          normalizePlanPrice(String(plan.price));
        }
        if (
          data.companies.some(
            (item) =>
              item.id !== company.id &&
              (item.cnpj === fields.cnpj ||
                (!!fields.email &&
                  item.email?.toLowerCase() === fields.email.toLowerCase())),
          )
        ) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'CNPJ ou e-mail de empresa já cadastrado.',
          });
        }
        const { planId, ...editable } = fields;
        Object.assign(company, editable, {
          plan_id: planId,
          updatedAt: new Date().toISOString(),
        });
      } else if (input.action === 'reactivate') {
        if (company.status !== 'inativo') {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'A empresa já está ativa.',
          });
        }
        company.status = 'ativo';
        company.updatedAt = new Date().toISOString();
      } else {
        company.status = 'inativo';
        company.deactivation_reason = input.reason;
        company.deactivated_at = new Date().toISOString();
        company.deactivated_by = String(input.actorId);
        company.updatedAt = company.deactivated_at;
        if (input.action === 'archive') {
          company.deleted_at = company.deactivated_at;
        }
        for (const user of data.users.filter(
          (item) => item.company_id === company.id,
        )) {
          user.invite_token = null;
          user.reset_password_token = null;
          user.reset_password_expires = null;
          user.tokens_revoked_at = new Date(
            Math.max(
              Date.now(),
              Date.parse(user.tokens_revoked_at || '1970-01-01') + 2,
            ),
          ).toISOString();
        }
      }
      return company;
    });
  },
  async createCompanyWithInitialSale(input) {
    return updateLocalData((data) => {
      const previous = data.companyRegistrationOperations.find(
        (item) =>
          item.actorId === String(input.actorId) &&
          item.operationId === input.operationId,
      );
      if (previous) {
        if (previous.fingerprint !== input.fingerprint) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'A operação já foi usada com outros dados.',
          });
        }
        const company = data.companies.find((item) => item.id === previous.companyId);
        const sale = data.sales.find((item) => item.id === previous.saleId);
        if (!company || !sale) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message:
              'A operação original não pode ser recriada. Consulte o cadastro existente.',
          });
        }
        return { company, sale, replayed: true };
      }
      const plan = data.plans.find((item) => String(item.id) === input.planId);
      if (!plan) {
        throw new AppError({
          status: 404,
          code: ErrorCode.NOT_FOUND,
          message: 'Plano não encontrado.',
        });
      }
      if (!plan.is_active) {
        throw new AppError({
          status: 400,
          code: ErrorCode.VALIDATION_ERROR,
          message: 'O plano está inativo.',
        });
      }
      if (
        data.companies.some(
          (item) =>
            item.cnpj === input.company.cnpj ||
            (input.company.email != null &&
              item.email?.toLowerCase() === input.company.email.toLowerCase()),
        )
      ) {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'CNPJ ou e-mail de empresa já cadastrado.',
        });
      }
      const actor = data.users.find(
        (item) => String(item.id) === String(input.actorId),
      );
      if (
        !actor ||
        actor.role !== 'super_admin' ||
        (actor.status != null && actor.status !== 'active')
      ) {
        throw new AppError({
          status: 403,
          code: ErrorCode.FORBIDDEN,
          message: 'Acesso administrativo alterado.',
        });
      }
      const company = { ...input.company, plan_id: String(plan.id) };
      const sale = createInitialSale(company.id, plan, input.actorId);
      data.companies.push(company);
      data.sales.push(sale);
      data.companyRegistrationOperations.push({
        actorId: String(input.actorId),
        operationId: input.operationId,
        fingerprint: input.fingerprint,
        companyId: company.id,
        saleId: sale.id,
        createdAt: sale.createdAt,
      });
      return { company, sale, replayed: false };
    });
  },
  async updateCoverKey(id, key, expectedKey) {
    return updateLocalData((data) => {
      const company = data.companies.find((company) => company.id === id);
      if (
        !company ||
        company.deleted_at ||
        company.status === 'inativo' ||
        (company.cover_key ?? null) !== expectedKey
      ) {
        return false;
      }
      company.cover_key = key;
      return true;
    });
  },
  async updateLogoKey(id, key, expectedKey) {
    return updateLocalData((data) => {
      const company = data.companies.find((company) => company.id === id);
      if (
        !company ||
        company.deleted_at ||
        company.status === 'inativo' ||
        (company.logo_key ?? null) !== expectedKey
      ) {
        return false;
      }
      company.logo_key = key;
      return true;
    });
  },
  async isImageKeyReferenced(key) {
    return (await readLocalData()).companies.some(
      (company) => company.cover_key === key || company.logo_key === key,
    );
  },

  async create(company) {
    return updateLocalData((data) => {
      if (
        data.companies.some(
          (existing) =>
            existing.cnpj === company.cnpj ||
            (company.email != null &&
              existing.email?.toLowerCase() === company.email.toLowerCase()),
        )
      ) {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'CNPJ ou e-mail de empresa já cadastrado.',
        });
      }
      data.companies.push(company);

      return company;
    });
  },

  async getAll() {
    return (await readLocalData()).companies;
  },

  async getById(id) {
    return (await readLocalData()).companies.find((company) => company.id === id);
  },

  async getVerified() {
    return (await readLocalData()).companies.filter((company) => company.verificado);
  },

  async getByCategory(category) {
    return (await readLocalData()).companies.filter(
      (company) => company.categoria.toLowerCase() === category.toLowerCase(),
    );
  },

  async getByState(state) {
    return (await readLocalData()).companies.filter(
      (company) => company.estado.toUpperCase() === state.toUpperCase(),
    );
  },

  async getBySize(size) {
    return (await readLocalData()).companies.filter(
      (company) => company.tamanho === size,
    );
  },

  async searchByName(name) {
    const search = createNameRegex(name);

    return (await readLocalData()).companies.filter((company) =>
      search.test(company.nome),
    );
  },

  async searchPublicCompanies(filters) {
    if (filters.q && !filters.uf && !filters.priceRange) {
      return this.searchByName(filters.q);
    }

    const search = filters.q ? createNameRegex(filters.q) : null;

    return (await readLocalData()).companies.filter((company) => {
      if (search && !search.test(company.nome)) {
        return false;
      }

      if (filters.uf && company.estado.toUpperCase() !== filters.uf.toUpperCase()) {
        return false;
      }

      if (filters.priceRange && company.faixa_preco !== filters.priceRange) {
        return false;
      }

      return true;
    });
  },
};
