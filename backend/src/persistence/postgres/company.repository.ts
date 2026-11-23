import type { CompanyRepository } from '../../repositories/company.repository.js';
import type {
  CompanyAdministrationChange,
  CompanyListFilters,
  PublicCompanySearchFilters,
} from '../../dtos/company.create.dto.js';
import type {
  CompanyRegistration,
  CompanyRegistrationResult,
} from '../../dtos/sale.dto.js';
import {
  PRICE_RANGE_TO_NUMRANGE,
  type Company,
  type CompanyPriceRange,
} from '../../entities/company.entity.js';
import type {
  companies,
  company_status,
  Prisma,
  sales,
} from '../../generated/prisma/client.js';
import type { PlanRow } from '../../interfaces/plan.row.js';
import { getPrisma } from '../../shared/config/prisma.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { toSale } from '../sale.mapper.js';
import type { SaleRow } from '../../interfaces/sale.row.js';

type Client = Prisma.TransactionClient;

function escapePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function mapCompany(row: companies, priceRange: CompanyPriceRange | null): Company {
  return {
    id: row.id,
    nome: row.name,
    cnpj: row.cnpj,
    descricao: row.description,
    descricao_detalhada: row.detailed_description,
    categoria: row.category,
    cidade: row.city,
    estado: row.state,
    status: row.status.toLowerCase() as Company['status'],
    verificado: true,
    tamanho: row.size as Company['tamanho'],
    faixa_preco: priceRange,
    data_cadastro: row.createdAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    logo: row.logo,
    cover_key: row.cover_key,
    logo_key: row.logo_key,
    endereco: row.address,
    telefone: row.phone,
    email: row.email,
    website: row.website,
    whatsapp: row.whatsapp,
    descritivo: row.additional_description,
    tone: row.tone as Company['tone'],
    plan_id: row.plan_id?.toString() ?? null,
    deleted_at: row.deleted_at?.toISOString() ?? null,
    deactivation_reason: row.deactivation_reason,
    deactivated_at: row.deactivated_at?.toISOString() ?? null,
    deactivated_by: row.deactivated_by,
  };
}

async function mapCompanies(tx: Client, rows: companies[]): Promise<Company[]> {
  if (!rows.length) {
    return [];
  }
  const ranges = await tx.$queryRaw<{ id: string; price_range: string | null }[]>`
    SELECT id, CASE
      WHEN price_range IS NULL THEN NULL
      WHEN lower(price_range) = 0 AND upper(price_range) = 100 THEN '0-100'
      WHEN lower(price_range) = 100 AND upper(price_range) = 300 THEN '100-300'
      WHEN lower(price_range) = 300 AND upper(price_range) = 500 THEN '300-500'
      WHEN lower(price_range) >= 500 AND upper_inf(price_range) THEN '500-plus'
      ELSE NULL END AS price_range
    FROM companies WHERE id = ANY(${rows.map((row) => row.id)}::uuid[])
  `;
  const byId = new Map(
    ranges.map((range) => [range.id, range.price_range as CompanyPriceRange | null]),
  );
  return rows.map((row) => mapCompany(row, byId.get(row.id) ?? null));
}

async function mapOne(tx: Client, row: companies): Promise<Company> {
  return (await mapCompanies(tx, [row]))[0];
}

async function writeRange(
  tx: Client,
  id: string,
  range?: CompanyPriceRange | null,
): Promise<void> {
  const value = range ? PRICE_RANGE_TO_NUMRANGE[range] : null;
  await tx.$executeRaw`UPDATE companies SET price_range = ${value}::numrange WHERE id = ${id}::uuid`;
}

function createData(
  company: Company,
  planId?: bigint,
): Prisma.companiesUncheckedCreateInput {
  return {
    id: company.id,
    name: company.nome,
    cnpj: company.cnpj,
    description: company.descricao,
    detailed_description: company.descricao_detalhada,
    category: company.categoria,
    city: company.cidade,
    state: company.estado,
    status: company.status.toUpperCase() as company_status,
    size: company.tamanho,
    ...(company.data_cadastro ? { createdAt: new Date(company.data_cadastro) } : {}),
    logo: company.logo ?? null,
    address: company.endereco ?? null,
    phone: company.telefone ?? null,
    email: company.email ?? null,
    website: company.website ?? null,
    whatsapp: company.whatsapp ?? null,
    additional_description: company.descritivo ?? null,
    tone: company.tone ?? null,
    ...(planId !== undefined ? { plan_id: planId } : {}),
  };
}

function saleRow(row: sales): SaleRow {
  return {
    ...row,
    plan_id: row.plan_id?.toString() ?? null,
    plan_price: row.plan_price?.toFixed(2) ?? null,
    amount: row.amount.toFixed(2),
    origin: row.origin as SaleRow['origin'],
    pricing_mode: row.pricing_mode as SaleRow['pricing_mode'],
    plan_billing_period: row.plan_billing_period as SaleRow['plan_billing_period'],
    currency: row.currency as SaleRow['currency'],
  };
}

function planRow(plan: {
  id: bigint;
  name: string;
  slug: string;
  description: string;
  price: { toString(): string };
  billing_period: string;
  features: unknown;
  limits: unknown;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
}): PlanRow {
  return {
    ...plan,
    id: plan.id.toString(),
    price: plan.price.toString(),
    billing_period: plan.billing_period as PlanRow['billing_period'],
  };
}

async function readCompanies(
  where: Prisma.companiesWhereInput = {},
  orderBy?: Prisma.companiesOrderByWithRelationInput[],
): Promise<Company[]> {
  return getPrisma().$transaction(
    async (tx) => mapCompanies(tx, await tx.companies.findMany({ where, orderBy })),
    { isolationLevel: 'RepeatableRead' },
  );
}

export const companyPostgresRepository: CompanyRepository = {
  async listPlatformCompanies(filters) {
    const where: Prisma.companiesWhereInput = {
      ...(filters.q
        ? {
            OR: [
              {
                name: {
                  contains: filters.q.replace(/[\\%_]/g, '\\$&'),
                  mode: 'insensitive',
                },
              },
              {
                cnpj: {
                  contains: filters.q.replace(/[\\%_]/g, '\\$&'),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(filters.planId ? { plan_id: BigInt(filters.planId) } : {}),
      ...(filters.status === 'archived'
        ? { deleted_at: { not: null } }
        : filters.status
          ? {
              deleted_at: null,
              status: filters.status === 'ativo' ? { not: 'INATIVO' } : 'INATIVO',
            }
          : {}),
    };
    return getPrisma().$transaction(
      async (tx) => {
        const total = await tx.companies.count({ where });
        const rows = await tx.companies.findMany({
          where,
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          take: filters.pageSize,
          skip: filters.offset,
        });
        return { total, items: await mapCompanies(tx, rows) };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  },
  async changeCompanyAdministration(input) {
    try {
      return await getPrisma().$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration', 0))`;
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${String(input.actorId)}::uuid FOR UPDATE`;
        const actor = await tx.users.findUnique({
          where: { id: String(input.actorId) },
        });
        if (
          !actor ||
          actor.role !== 'SUPER_ADMIN' ||
          actor.deleted_at ||
          actor.status !== 'ACTIVE'
        ) {
          throw new AppError({
            status: 403,
            code: ErrorCode.FORBIDDEN,
            message: 'Acesso administrativo alterado.',
          });
        }
        await tx.$queryRaw`SELECT id FROM companies WHERE id = ${input.companyId}::uuid FOR UPDATE`;
        const company = await tx.companies.findUnique({
          where: { id: input.companyId },
        });
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
          return mapOne(
            tx,
            await tx.companies.update({
              where: { id: company.id },
              data: { deleted_at: null, status: 'INATIVO' },
            }),
          );
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
          const planId = BigInt(fields.planId);
          await tx.$queryRaw`SELECT id FROM plans WHERE id = ${planId} FOR SHARE`;
          const plan = await tx.plans.findUnique({ where: { id: planId } });
          if (!plan) {
            throw new AppError({
              status: 404,
              code: ErrorCode.NOT_FOUND,
              message: 'Plano não encontrado.',
            });
          }
          if (company.plan_id !== planId) {
            if (!plan.is_active) {
              throw new AppError({
                status: 400,
                code: ErrorCode.VALIDATION_ERROR,
                message: 'Plano inativo.',
              });
            }
            const { normalizePlanPrice } =
              await import('../../services/plan.service.js');
            normalizePlanPrice(plan.price.toString());
          }
          const updated = await tx.companies.update({
            where: { id: company.id },
            data: {
              name: fields.nome,
              cnpj: fields.cnpj,
              description: fields.descricao,
              detailed_description: fields.descricao_detalhada,
              category: fields.categoria,
              city: fields.cidade,
              state: fields.estado,
              size: fields.tamanho,
              logo: fields.logo,
              address: fields.endereco,
              phone: fields.telefone,
              email: fields.email,
              website: fields.website,
              whatsapp: fields.whatsapp,
              additional_description: fields.descritivo,
              tone: fields.tone,
              plan_id: planId,
            },
          });
          if (fields.faixa_preco !== undefined) {
            await writeRange(tx, company.id, fields.faixa_preco);
          }
          return mapOne(tx, updated);
        }
        if (input.action === 'reactivate') {
          if (company.status !== 'INATIVO') {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'A empresa já está ativa.',
            });
          }
          return mapOne(
            tx,
            await tx.companies.update({
              where: { id: company.id },
              data: { status: 'ATIVO' },
            }),
          );
        }
        await tx.$executeRaw`UPDATE users SET invite_token=NULL, reset_password_token=NULL, reset_password_expires=NULL, tokens_revoked_at=GREATEST(${new Date(input.changedAt)}::timestamptz,date_trunc('milliseconds',clock_timestamp()),COALESCE(tokens_revoked_at,'epoch'::timestamptz)+INTERVAL '2 milliseconds'), updated_at=NOW() WHERE company_id=${company.id}::uuid`;
        const nowRows = await tx.$queryRaw<
          { changed_at: Date }[]
        >`SELECT GREATEST(${new Date(input.changedAt)}::timestamptz,date_trunc('milliseconds',clock_timestamp())) AS changed_at`;
        const changedAt = nowRows[0].changed_at;
        return mapOne(
          tx,
          await tx.companies.update({
            where: { id: company.id },
            data: {
              status: 'INATIVO',
              deactivation_reason: input.reason,
              deactivated_at: changedAt,
              deactivated_by: String(input.actorId),
              ...(input.action === 'archive' ? { deleted_at: changedAt } : {}),
            },
          }),
        );
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'CNPJ ou e-mail de empresa já cadastrado.',
        });
      }
      throw error;
    }
  },
  async createCompanyWithInitialSale(input) {
    try {
      return await getPrisma().$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${String(input.actorId) + ':' + input.operationId}, 0))`;
        const previous = await tx.company_registration_operations.findUnique({
          where: {
            actor_id_operation_id: {
              actor_id: String(input.actorId),
              operation_id: input.operationId,
            },
          },
        });
        if (previous) {
          if (previous.fingerprint !== input.fingerprint) {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'A operação já foi usada com outros dados.',
            });
          }
          const company = await tx.companies.findUnique({
            where: { id: previous.company_id },
          });
          const sale = previous.sale_id
            ? await tx.sales.findUnique({ where: { id: previous.sale_id } })
            : null;
          if (!company || !sale) {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message:
                'A operação original não pode ser recriada. Consulte o cadastro existente.',
            });
          }
          return {
            company: await mapOne(tx, company),
            sale: toSale(saleRow(sale)),
            replayed: true,
          };
        }
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${String(input.actorId)}::uuid FOR SHARE`;
        const actor = await tx.users.findUnique({
          where: { id: String(input.actorId) },
        });
        if (!actor || actor.role !== 'SUPER_ADMIN' || actor.status !== 'ACTIVE') {
          throw new AppError({
            status: 403,
            code: ErrorCode.FORBIDDEN,
            message: 'Acesso administrativo alterado.',
          });
        }
        const planId = BigInt(input.planId);
        await tx.$queryRaw`SELECT id FROM plans WHERE id = ${planId} FOR SHARE`;
        const plan = await tx.plans.findUnique({ where: { id: planId } });
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
        const company = { ...input.company, plan_id: String(plan.id) };
        const { createInitialSale } = await import('../../services/sale.service.js');
        const sale = createInitialSale(company.id, planRow(plan), input.actorId);
        await tx.companies.create({ data: createData(company, plan.id) });
        await writeRange(tx, company.id, company.faixa_preco);
        await tx.sales.create({
          data: {
            id: sale.id,
            company_id: sale.companyId,
            plan_id: sale.planId ? BigInt(sale.planId) : null,
            origin: sale.origin,
            pricing_mode: sale.pricingMode,
            plan_name: sale.planName,
            plan_price: sale.planPrice,
            plan_billing_period: sale.planBillingPeriod,
            amount: sale.amount,
            currency: sale.currency,
            description: sale.description,
            sold_at: new Date(sale.soldAt),
            created_at: new Date(sale.createdAt),
            created_by: sale.createdBy,
          },
        });
        await tx.company_registration_operations.create({
          data: {
            actor_id: String(input.actorId),
            operation_id: input.operationId,
            fingerprint: input.fingerprint,
            company_id: company.id,
            sale_id: sale.id,
          },
        });
        return { company: { ...company, verificado: true }, sale, replayed: false };
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'CNPJ, e-mail ou operação já cadastrado.',
        });
      }
      throw error;
    }
  },
  async updateCoverKey(id, key, expectedKey) {
    return (
      (
        await getPrisma().companies.updateMany({
          where: {
            id,
            cover_key: expectedKey,
            deleted_at: null,
            status: { not: 'INATIVO' },
          },
          data: { cover_key: key },
        })
      ).count === 1
    );
  },
  async updateLogoKey(id, key, expectedKey) {
    return (
      (
        await getPrisma().companies.updateMany({
          where: {
            id,
            logo_key: expectedKey,
            deleted_at: null,
            status: { not: 'INATIVO' },
          },
          data: { logo_key: key },
        })
      ).count === 1
    );
  },
  async isImageKeyReferenced(key) {
    return (
      (await getPrisma().companies.count({
        where: { OR: [{ cover_key: key }, { logo_key: key }] },
      })) > 0
    );
  },
  async create(company) {
    return getPrisma().$transaction(async (tx) => {
      const row = await tx.companies.create({ data: createData(company) });
      await writeRange(tx, row.id, company.faixa_preco);
      return mapOne(tx, row);
    });
  },
  async getAll() {
    return readCompanies();
  },
  async getById(id) {
    return getPrisma().$transaction(
      async (tx) => {
        const row = await tx.companies.findUnique({ where: { id } });
        return row ? mapOne(tx, row) : undefined;
      },
      { isolationLevel: 'RepeatableRead' },
    );
  },
  async getByCategory(category) {
    return readCompanies({
      category: { equals: escapePattern(category), mode: 'insensitive' },
    });
  },
  async getByState(state) {
    return readCompanies({
      state: { equals: escapePattern(state), mode: 'insensitive' },
    });
  },
  async getBySize(size) {
    return readCompanies({ size });
  },
  async searchByName(name) {
    return readCompanies({ name: { contains: name, mode: 'insensitive' } });
  },
  async searchPublicCompanies(filters) {
    if (filters.q && !filters.uf && !filters.priceRange) {
      return this.searchByName(filters.q);
    }
    return getPrisma().$transaction(
      async (tx) => {
        let ids: string[] | undefined;
        if (filters.priceRange) {
          const range = PRICE_RANGE_TO_NUMRANGE[filters.priceRange];
          const matches = await tx.$queryRaw<
            { id: string }[]
          >`SELECT id FROM companies WHERE price_range IS NOT NULL AND price_range && ${range}::numrange`;
          ids = matches.map((row) => row.id);
        }
        const rows = await tx.companies.findMany({
          where: {
            deleted_at: null,
            status: { not: 'INATIVO' },
            ...(ids ? { id: { in: ids } } : {}),
            ...(filters.q
              ? {
                  name: {
                    contains: filters.q.replace(/[\\%_]/g, '\\$&'),
                    mode: 'insensitive',
                  },
                }
              : {}),
            ...(filters.uf
              ? { state: { equals: filters.uf, mode: 'insensitive' } }
              : {}),
          },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
        });
        return mapCompanies(tx, rows);
      },
      { isolationLevel: 'RepeatableRead' },
    );
  },
};
