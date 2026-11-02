import type { CompanyRepository } from '../../repositories/company.repository.js';
import { readLocalData, updateLocalData } from './local.store.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { createInitialSale } from '../../services/sale.service.js';

export const companyJsonRepository: CompanyRepository = {
  async createCompanyWithInitialSale(input) {
    return updateLocalData(data => {
      const previous = data.companyRegistrationOperations.find(item => item.actorId === String(input.actorId) && item.operationId === input.operationId);
      if (previous) {
        if (previous.fingerprint !== input.fingerprint) throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'A operação já foi usada com outros dados.' });
        const company = data.companies.find(item => item.id === previous.companyId);
        const sale = data.sales.find(item => item.id === previous.saleId);
        if (!company || !sale) throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'A operação original não pode ser recriada. Consulte o cadastro existente.' });
        return { company, sale, replayed: true };
      }
      const plan = data.plans.find(item => String(item.id) === input.planId);
      if (!plan) throw new AppError({ status: 404, code: ErrorCode.NOT_FOUND, message: 'Plano não encontrado.' });
      if (!plan.is_active) throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'O plano está inativo.' });
      if (data.companies.some(item => item.cnpj === input.company.cnpj
        || (input.company.email != null && item.email?.toLowerCase() === input.company.email.toLowerCase()))) {
        throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'CNPJ ou e-mail de empresa já cadastrado.' });
      }
      const actor = data.users.find(item => String(item.id) === String(input.actorId));
      if (!actor || actor.role !== 'super_admin' || (actor.status != null && actor.status !== 'active')) throw new AppError({ status: 403, code: ErrorCode.FORBIDDEN, message: 'Acesso administrativo alterado.' });
      const company = { ...input.company, plan_id: String(plan.id) };
      const sale = createInitialSale(company.id, plan, input.actorId);
      data.companies.push(company);
      data.sales.push(sale);
      data.companyRegistrationOperations.push({ actorId: String(input.actorId), operationId: input.operationId,
        fingerprint: input.fingerprint, companyId: company.id, saleId: sale.id, createdAt: sale.createdAt });
      return { company, sale, replayed: false };
    });
  },
  async updateCoverKey(id, key, expectedKey) {
    return updateLocalData(data => {
      const company = data.companies.find(company => company.id === id);
      if (!company || (company.cover_key ?? null) !== expectedKey) return false;
      company.cover_key = key;
      return true;
    });
  },
  async updateLogoKey(id, key, expectedKey) {
    return updateLocalData(data => {
      const company = data.companies.find(company => company.id === id);
      if (!company || (company.logo_key ?? null) !== expectedKey) return false;
      company.logo_key = key;
      return true;
    });
  },
  async isImageKeyReferenced(key) {
    return (await readLocalData()).companies.some(company => company.cover_key === key || company.logo_key === key);
  },

  async create(company) {
    return updateLocalData(data => {
      if (data.companies.some(existing => existing.cnpj === company.cnpj
        || (company.email != null && existing.email?.toLowerCase() === company.email.toLowerCase()))) {
        throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'CNPJ ou e-mail de empresa já cadastrado.' });
      }
      data.companies.push(company);

      return company;
    });
  },

  async getAll() {
    return (await readLocalData()).companies;
  },

  async getById(id) {
    return (await readLocalData()).companies.find(company => company.id === id);
  },

  async getVerified() {
    return (await readLocalData()).companies.filter(company => company.verificado);
  },

  async getByCategory(category) {
    return (await readLocalData()).companies.filter(company => company.categoria.toLowerCase() === category.toLowerCase());
  },

  async getByState(state) {
    return (await readLocalData()).companies.filter(company => company.estado.toUpperCase() === state.toUpperCase());
  },

  async getBySize(size) {
    return (await readLocalData()).companies.filter(company => company.tamanho === size);
  },

  async searchByName(name) {
    // Mantém os curingas % e _ observados no ILIKE do PostgreSQL.
    const pattern = [...name].map(character => {
      if (character === '%') {
        return '.*';
      }

      if (character === '_') {
        return '.';
      }

      return character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('');
    const search = new RegExp(pattern, 'iu');

    return (await readLocalData()).companies.filter(company => search.test(company.nome));
  },
};
