import type { CompanyRepository } from '../../repositories/company.repository.js';
import { readLocalData, updateLocalData } from './local.store.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';

export const companyJsonRepository: CompanyRepository = {
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
