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

  return companyRepository.create(company);
}

export async function getCompanies(): Promise<Company[]> {
  return companyRepository.getAll();
}

export async function getVerifiedCompanies(): Promise<Company[]> {
  return companyRepository.getVerified();
}

export async function getCompaniesByCategory(category: string): Promise<Company[]> {
  return companyRepository.getByCategory(category);
}

export async function getCompaniesByState(state: string): Promise<Company[]> {
  return companyRepository.getByState(state);
}

export async function getCompaniesBySize(size: 'pequena' | 'media' | 'grande'): Promise<Company[]> {
  return companyRepository.getBySize(size);
}

export async function searchCompanies(name: string): Promise<Company[]> {
  return companyRepository.searchByName(name);
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

  return company;
}
