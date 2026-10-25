import type { CompanyRepository } from '../../repositories/company.repository.js';
import { readLocalData, updateLocalData } from './local.store.js';

export const companyJsonRepository: CompanyRepository = {
  // Estrutura inicial: implementar persistência local antes de usar.
  async updateCoverKey(_id: string, _coverKey: string | null): Promise<void> {},

  async updateLogoKey(_id: string, _logoKey: string | null): Promise<void> {},

  async create(company) {
    return updateLocalData(data => {
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
