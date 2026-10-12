import { getLogger } from '../shared/logging/log.context.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import type { Company } from '../entities/company.entity.js';
import { randomUUID } from 'node:crypto';
import { companyCreateSchema } from '../dtos/company.create.dto.js';
import { companyRepository } from '../persistence/company.repository.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';

export async function createCompany(input: unknown): Promise<Company> {
  const parsed = companyCreateSchema.safeParse(input, { error: () => 'Valor inválido para este campo.' });

  if (!parsed.success) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Dados da empresa inválidos.',
      details: parsed.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
    });
  }

  const company: Company = {
    ...parsed.data,
    id: randomUUID(),
    data_cadastro: new Date().toISOString(),
    status: 'ativo',
    verificado: false,
  };

  const created = await companyRepository.create(company);

  getLogger().info({
    event: 'company.created',
    module: 'companies',
    message: 'Empresa cadastrada com sucesso',
    context: { companyId: created.id, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return created;
}

export async function getCompanies(): Promise<Company[]> {
  const companies = await companyRepository.getAll();

  getLogger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'all', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function getVerifiedCompanies(): Promise<Company[]> {
  const companies = await companyRepository.getVerified();

  getLogger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'verified', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function getCompaniesByCategory(category: string): Promise<Company[]> {
  const companies = await companyRepository.getByCategory(category);

  getLogger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'category', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function getCompaniesByState(state: string): Promise<Company[]> {
  const companies = await companyRepository.getByState(state);

  getLogger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'state', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function getCompaniesBySize(size: 'pequena' | 'media' | 'grande'): Promise<Company[]> {
  const companies = await companyRepository.getBySize(size);

  getLogger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'size', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function searchCompanies(name: string): Promise<Company[]> {
  const companies = await companyRepository.searchByName(name);

  getLogger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'search', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function getCompanyById(id: string): Promise<Company> {
  const company = await companyRepository.getById(id);

  if (!company) {
    throw new AppError({
      status: 404,
      code: ErrorCode.NOT_FOUND,
      message: `Empresa com ID ${id} não encontrada`,
    });
  }

  getLogger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresa concluída',
    context: { operation: 'get-by-id', companyId: company.id, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return company;
}
