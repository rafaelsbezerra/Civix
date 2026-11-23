import type { SaleRepository } from '../../repositories/sale.repository.js';
import type { ManualSaleOperation, SaleListFilters } from '../../dtos/sale.dto.js';
import type { Sale } from '../../entities/sale.entity.js';
import type { UserId } from '../../entities/user.entity.js';
import type { Prisma, sales } from '../../generated/prisma/client.js';
import type { PlanRow } from '../../interfaces/plan.row.js';
import type { SaleRow } from '../../interfaces/sale.row.js';
import { getPrisma } from '../../shared/config/prisma.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { toSale } from '../sale.mapper.js';

function mapSale(row: sales, companyName?: string): Sale {
  return toSale({
    ...row,
    company_name: companyName,
    plan_id: row.plan_id?.toString() ?? null,
    origin: row.origin as SaleRow['origin'],
    pricing_mode: row.pricing_mode as SaleRow['pricing_mode'],
    plan_price: row.plan_price?.toFixed(2) ?? null,
    plan_billing_period: row.plan_billing_period as SaleRow['plan_billing_period'],
    amount: row.amount.toFixed(2),
    currency: row.currency as SaleRow['currency'],
  });
}

async function lockAdministrativeActor(
  tx: Prisma.TransactionClient,
  actorId: UserId,
): Promise<void> {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration', 0))
  `;
  const [lockedActor] = await tx.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM users
    WHERE id = ${String(actorId)}::uuid
    FOR UPDATE
  `;
  const actor = lockedActor
    ? await tx.users.findUnique({
        where: { id: lockedActor.id },
        select: { role: true, status: true, deleted_at: true },
      })
    : null;
  if (
    !actor ||
    actor.role.toLowerCase() !== 'super_admin' ||
    actor.deleted_at ||
    (actor.status != null && actor.status.toLowerCase() !== 'active')
  ) {
    throw new AppError({
      status: 403,
      code: ErrorCode.FORBIDDEN,
      message: 'Acesso administrativo alterado.',
    });
  }
}

export const salePostgresRepository: SaleRepository = {
  async listPlatformSales(filters) {
    const prisma = getPrisma();
    const where: Prisma.salesWhereInput = {
      company_id: filters.companyId,
      plan_id: filters.planId === undefined ? undefined : BigInt(filters.planId),
      origin: filters.origin,
      sold_at: {
        gte: filters.from === undefined ? undefined : new Date(filters.from),
        lte: filters.to === undefined ? undefined : new Date(filters.to),
      },
    };
    const [total, rows] = await prisma.$transaction(
      [
        prisma.sales.count({ where }),
        prisma.sales.findMany({
          where,
          include: { companies: { select: { name: true } } },
          orderBy: [{ sold_at: 'desc' }, { id: 'asc' }],
          skip: filters.offset,
          take: filters.pageSize,
        }),
      ],
      { isolationLevel: 'RepeatableRead' },
    );
    return { items: rows.map((row) => mapSale(row, row.companies.name)), total };
  },

  async createManualSale(operation) {
    const { buildManualSale } = await import('../../services/sale.service.js');
    return getPrisma().$transaction(async (tx) => {
      await lockAdministrativeActor(tx, operation.actorId);

      const previous = await tx.sales.findFirst({
        where: {
          created_by: String(operation.actorId),
          operation_id: operation.input.operationId,
        },
      });
      if (previous) {
        if (previous.fingerprint !== operation.fingerprint) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'A operação já foi usada com outros dados.',
          });
        }
        return { sale: mapSale(previous), replayed: true };
      }

      const [lockedCompany] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM companies
        WHERE id = ${operation.input.companyId}::uuid
        FOR SHARE
      `;
      const company = lockedCompany
        ? await tx.companies.findUnique({
            where: { id: lockedCompany.id },
            select: { plan_id: true, status: true, deleted_at: true },
          })
        : null;
      if (
        !company ||
        company.deleted_at ||
        company.status.toLowerCase() === 'inativo'
      ) {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Empresa indisponível para nova venda.',
        });
      }

      let plan: PlanRow | undefined;
      if (operation.input.pricingMode === 'company_plan' && company.plan_id !== null) {
        const [lockedPlan] = await tx.$queryRaw<{ id: bigint }[]>`
          SELECT id
          FROM plans
          WHERE id = ${company.plan_id}
          FOR SHARE
        `;
        const row = lockedPlan
          ? await tx.plans.findUnique({ where: { id: lockedPlan.id } })
          : null;
        if (row) {
          plan = {
            ...row,
            id: row.id.toString(),
            price: row.price.toFixed(2),
            billing_period: row.billing_period as PlanRow['billing_period'],
          };
        }
      }

      const sale = buildManualSale(operation, plan);
      await tx.sales.create({
        data: {
          id: sale.id,
          company_id: sale.companyId,
          plan_id: sale.planId === null ? null : BigInt(sale.planId),
          origin: sale.origin,
          pricing_mode: sale.pricingMode,
          plan_name: sale.planName,
          plan_price: sale.planPrice,
          plan_billing_period: sale.planBillingPeriod,
          amount: sale.amount,
          currency: sale.currency,
          description: sale.description,
          sold_at: sale.soldAt,
          created_at: sale.createdAt,
          created_by: sale.createdBy,
          operation_id: sale.operationId,
          fingerprint: sale.fingerprint,
        },
      });
      return { sale, replayed: false };
    });
  },

  async deleteSaleById(id, actorId) {
    return getPrisma().$transaction(async (tx) => {
      await lockAdministrativeActor(tx, actorId);
      const { count } = await tx.sales.deleteMany({ where: { id } });
      return count === 1;
    });
  },

  async getById(id) {
    const row = await getPrisma().sales.findUnique({ where: { id } });
    return row ? mapSale(row) : undefined;
  },
};
