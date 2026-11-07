import type { Company } from '../entities/company.entity.js';
import type {
  CompanyRegistration,
  CompanyRegistrationResult,
} from '../dtos/sale.dto.js';
import type {
  CompanyListFilters,
  CompanyAdministrationChange,
} from '../dtos/company.create.dto.js';

/** Consultas de catálogo sem dependência do driver ou do contrato HTTP. */
export interface CompanyRepository {
  listPlatformCompanies(
    filters: CompanyListFilters,
  ): Promise<{ items: Company[]; total: number }>;
  changeCompanyAdministration(input: CompanyAdministrationChange): Promise<Company>;
  createCompanyWithInitialSale(
    input: CompanyRegistration,
  ): Promise<CompanyRegistrationResult>;
  isImageKeyReferenced(key: string): Promise<boolean>;
  create(company: Company): Promise<Company>;
  getAll(): Promise<Company[]>;
  getById(id: string): Promise<Company | undefined>;
  getVerified(): Promise<Company[]>;
  getByCategory(category: string): Promise<Company[]>;
  getByState(state: string): Promise<Company[]>;
  getBySize(size: Company['tamanho']): Promise<Company[]>;
  searchByName(name: string): Promise<Company[]>;
  updateCoverKey(
    id: string,
    coverKey: string | null,
    expectedKey: string | null,
  ): Promise<boolean>;
  updateLogoKey(
    id: string,
    logoKey: string | null,
    expectedKey: string | null,
  ): Promise<boolean>;
}
