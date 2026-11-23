import { randomUUID } from 'node:crypto';
import type { PlanRow } from '../interfaces/plan.row.js';
import type { Sale } from '../entities/sale.entity.js';
import type { UserId } from '../entities/user.entity.js';
import { normalizePlanPrice } from './plan.service.js';
import { validatePlanId } from './plan.service.js';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { manualSaleSchema, type ManualSaleOperation } from '../dtos/sale.dto.js';
import { requireSuperAdminActor } from './user.service.js';
import { saleRepository } from '../persistence/index.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import {
  parsePagination,
  createPaginationMeta,
} from '../shared/contracts/pagination.contract.js';

export function presentSale(sale: Sale) {
  const { fingerprint: _fingerprint, operationId: _operation, ...result } = sale;
  return result;
}
export function buildManualSale(operation: ManualSaleOperation, plan?: PlanRow): Sale {
  const input = operation.input;
  if (input.pricingMode === 'company_plan' && (!plan || !plan.is_active)) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'A empresa precisa de plano atual ativo e com preço positivo.',
    });
  }
  const amount = normalizePlanPrice(
    input.pricingMode === 'manual_amount' ? input.amount : String(plan!.price),
  );
  return {
    id: randomUUID(),
    companyId: input.companyId,
    planId: input.pricingMode === 'company_plan' ? String(plan!.id) : null,
    origin: 'manual',
    pricingMode: input.pricingMode,
    planName: input.pricingMode === 'company_plan' ? plan!.name : null,
    planPrice: input.pricingMode === 'company_plan' ? amount : null,
    planBillingPeriod:
      input.pricingMode === 'company_plan' ? plan!.billing_period : null,
    amount,
    currency: 'BRL',
    description: input.description || null,
    soldAt: input.soldAt,
    createdAt: new Date().toISOString(),
    createdBy: String(operation.actorId),
    operationId: input.operationId,
    fingerprint: operation.fingerprint,
  };
}
export async function createManualSale(actorId: UserId, input: unknown) {
  await requireSuperAdminActor(actorId);
  const parsed = manualSaleSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message:
        'Dados da venda inválidos. Valor manual exige montante positivo e motivo; data deve estar em UTC.',
    });
  }
  const normalized = {
    ...parsed.data,
    companyId: parsed.data.companyId.toLowerCase(),
    operationId: parsed.data.operationId.toLowerCase(),
    soldAt: new Date(parsed.data.soldAt).toISOString(),
    description: parsed.data.description || '',
  };
  const data =
    normalized.pricingMode === 'manual_amount'
      ? { ...normalized, amount: normalizePlanPrice(normalized.amount) }
      : normalized;
  const { operationId: _operation, ...content } = data;
  const fingerprint = createHash('sha256')
    .update(JSON.stringify(content))
    .digest('hex');
  const result = await saleRepository.createManualSale({
    actorId,
    input: data,
    fingerprint,
  });
  return { sale: presentSale(result.sale), replayed: result.replayed };
}
export async function getPlatformSale(actorId: UserId, id: string) {
  await requireSuperAdminActor(actorId);
  if (!z.string().uuid().safeParse(id).success) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'ID da venda inválido.',
    });
  }
  const sale = await saleRepository.getById(id);
  if (!sale) {
    throw new AppError({
      status: 404,
      code: ErrorCode.NOT_FOUND,
      message: 'Venda não encontrada.',
    });
  }
  return presentSale(sale);
}
export async function deleteSaleById(actorId: UserId, id: string) {
  await getPlatformSale(actorId, id);
  if (!(await saleRepository.deleteSaleById(id, actorId))) {
    throw new AppError({
      status: 404,
      code: ErrorCode.NOT_FOUND,
      message: 'Venda não encontrada.',
    });
  }
}
export async function listPlatformSales(actorId: UserId, input: unknown) {
  await requireSuperAdminActor(actorId);
  const parsed = z
    .object({
      companyId: z.string().uuid().optional(),
      planId: z.string().optional(),
      origin: z.enum(['manual', 'company_creation']).optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      page: z.unknown().optional(),
      limit: z.unknown().optional(),
    })
    .strict()
    .safeParse(input);
  if (
    !parsed.success ||
    (parsed.data.from &&
      parsed.data.to &&
      Date.parse(parsed.data.from) > Date.parse(parsed.data.to))
  ) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Filtros de venda inválidos.',
    });
  }
  if (parsed.data.planId !== undefined) {
    validatePlanId(parsed.data.planId);
  }
  const pagination = parsePagination({
    page: parsed.data.page,
    pageSize: parsed.data.limit,
  });
  const { items, total } = await saleRepository.listPlatformSales({
    ...parsed.data,
    ...pagination,
  });
  return {
    data: items.map(presentSale),
    meta: createPaginationMeta(pagination, total),
  };
}

export function createInitialSale(
  companyId: string,
  plan: PlanRow,
  actorId: UserId,
): Sale {
  const now = new Date().toISOString();
  const amount = normalizePlanPrice(String(plan.price));
  return {
    id: randomUUID(),
    companyId,
    planId: String(plan.id),
    origin: 'company_creation',
    pricingMode: 'company_plan',
    planName: plan.name,
    planPrice: amount,
    planBillingPeriod: plan.billing_period,
    amount,
    currency: 'BRL',
    description: null,
    soldAt: now,
    createdAt: now,
    createdBy: String(actorId),
  };
}
