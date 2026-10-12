import type { CompanyRepository } from '../repositories/company.repository.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import { companyJsonRepository } from './json/company.repository.js';
import { companyPostgresRepository } from './postgres/company.repository.js';

export const companyRepository: CompanyRepository = USE_MOCK_DATA ? companyJsonRepository : companyPostgresRepository;