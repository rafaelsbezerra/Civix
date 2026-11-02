import { logger } from '../shared/logging/log.context.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import type { Company } from '../entities/company.entity.js';
import { randomUUID } from 'node:crypto';
import { companyCreateSchema } from '../dtos/company.create.dto.js';
import { companyRepository } from '../persistence/company.repository.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { getPresignedImageUrl } from './storage.service.js';
import { storageRepository } from '../persistence/storage.repository.js';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import type { UserId } from '../entities/user.entity.js';
import { getAuthenticatedUser } from './user.service.js';
import { validatePlanId } from './plan.service.js';

const registrationSchema = companyCreateSchema.extend({
  planId: z.string().trim().min(1).max(128), operationId: z.string().uuid().transform(value => value.toLowerCase()),
}).strict();

export async function createCompanyWithInitialSale(input: unknown, actorId: UserId) {
  const actor = await getAuthenticatedUser(actorId);
  if (actor.role !== 'super_admin') throw new AppError({ status: 403, code: ErrorCode.FORBIDDEN, message: 'Acesso exclusivo da administração da Civix.' });
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'Dados da empresa, plano ou operação inválidos.' });
  const { planId, operationId, ...fields } = parsed.data;
  validatePlanId(planId);
  const fingerprint = createHash('sha256').update(JSON.stringify({ ...fields, planId })).digest('hex');
  const company: Company = { ...fields, id: randomUUID(), data_cadastro: new Date().toISOString(), status: 'ativo', verificado: false };
  return companyRepository.createCompanyWithInitialSale({ company, planId, operationId, fingerprint, actorId });
}

export async function updateCompanyCoverKey(companyId: string, key: string | null, expectedKey: string | null): Promise<void> {
  if (!await companyRepository.updateCoverKey(companyId, key, expectedKey)) {
    throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'A capa foi alterada por outra operação. Atualize e tente novamente.' });
  }
}

export async function updateCompanyLogoKey(companyId: string, key: string | null, expectedKey: string | null): Promise<void> {
  if (!await companyRepository.updateLogoKey(companyId, key, expectedKey)) {
    throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'A logo foi alterada por outra operação.' });
  }
}

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

  logger().info({
    event: 'company.created',
    module: 'companies',
    message: 'Empresa cadastrada com sucesso',
    context: { companyId: created.id, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return created;
}

export async function getCompanies(): Promise<Company[]> {
  const companies = await companyRepository.getAll();

  logger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'all', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function getVerifiedCompanies(): Promise<Company[]> {
  const companies = await companyRepository.getVerified();

  logger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'verified', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function getCompaniesByCategory(category: string): Promise<Company[]> {
  const companies = await companyRepository.getByCategory(category);

  logger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'category', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function getCompaniesByState(state: string): Promise<Company[]> {
  const companies = await companyRepository.getByState(state);

  logger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'state', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function getCompaniesBySize(size: 'pequena' | 'media' | 'grande'): Promise<Company[]> {
  const companies = await companyRepository.getBySize(size);

  logger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresas concluída',
    context: { operation: 'size', count: companies.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return companies;
}

export async function searchCompanies(name: string): Promise<Company[]> {
  const companies = await companyRepository.searchByName(name);

  logger().debug({
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

  logger().debug({
    event: 'company.queried',
    module: 'companies',
    message: 'Consulta de empresa concluída',
    context: { operation: 'get-by-id', companyId: company.id, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return company;
}

export async function presentCompany(company: Company) {
  const { cover_key, logo_key: _logoKey, plan_id: _planId,
    deleted_at: _deletedAt, deactivation_reason: _reason, deactivated_at: _deactivatedAt,
    deactivated_by: _actor, ...publicCompany } = company;
  if (!cover_key || company.status === 'inativo') {
    return { ...publicCompany, cover_image_url: null };
  }
  const image = await storageRepository.getByObjectKey(cover_key);
  if (!image || image.resource_id !== company.id || image.module !== 'companies' || image.purpose !== 'cover') {
    return { ...publicCompany, cover_image_url: null };
  }
  try {
    const signed = await getPresignedImageUrl(image.id);
    return { ...publicCompany, cover_image_url: signed.url };
  } catch (error) {
    // Uma troca concorrente pode invalidar a imagem, mas não a empresa consultada.
    if (error instanceof AppError && error.status === 404) {
      return { ...publicCompany, cover_image_url: null };
    }
    throw error;
  }
}
