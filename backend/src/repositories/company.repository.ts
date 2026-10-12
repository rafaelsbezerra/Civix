import type { Company } from '../entities/company.entity.js';

/** Consultas de catálogo sem dependência do driver ou do contrato HTTP. */
export interface CompanyRepository {
  create(company: Company): Promise<Company>;
  getAll(): Promise<Company[]>;
  getById(id: string): Promise<Company | undefined>;
  getVerified(): Promise<Company[]>;
  getByCategory(category: string): Promise<Company[]>;
  getByState(state: string): Promise<Company[]>;
  getBySize(size: Company['tamanho']): Promise<Company[]>;
  searchByName(name: string): Promise<Company[]>;
}
