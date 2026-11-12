import type { PlanRepository } from '../../repositories/plan.repository.js';
import type { PlanInput } from '../../entities/plan.entity.js';
import type { UserId } from '../../entities/user.entity.js';
import type { plans, Prisma } from '../../generated/prisma/client.js';
import type { PlanRow } from '../../interfaces/plan.row.js';
import { getPrisma } from '../../shared/config/prisma.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';

function mapPlan(plan: plans): PlanRow {
  return {
    ...plan,
    id: plan.id.toString(),
    price: plan.price.toFixed(2),
    billing_period: plan.billing_period as PlanRow['billing_period'],
  };
}

function planData(input: PlanInput): Prisma.plansUncheckedCreateInput {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    billing_period: input.billingPeriod,
    features: input.features,
    limits: input.limits,
    is_featured: input.isFeatured,
    is_active: input.isActive,
    display_order: input.displayOrder,
  };
}

async function writePlan<T>(
  actorId: UserId,
  action: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await getPrisma().$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration', 0))`;
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${actorId}::uuid FOR UPDATE`;
      const actor = await tx.users.findUnique({ where: { id: String(actorId) } });
      if (
        !actor ||
        actor.role !== 'SUPER_ADMIN' ||
        actor.company_id !== null ||
        !actor.password_hash ||
        actor.deleted_at ||
        actor.status !== 'ACTIVE'
      ) {
        throw new AppError({
          status: 403,
          code: ErrorCode.FORBIDDEN,
          message: 'Acesso administrativo alterado.',
        });
      }
      return action(tx);
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      throw new AppError({
        status: 409,
        code: ErrorCode.CONFLICT,
        message: 'Identificador do plano já cadastrado.',
      });
    }
    throw error;
  }
}

export const planPostgresRepository: PlanRepository = {
  async getAll() {
    return (
      await getPrisma().plans.findMany({
        orderBy: [{ display_order: 'asc' }, { id: 'asc' }],
      })
    ).map(mapPlan);
  },
  async getById(id) {
    const plan = await getPrisma().plans.findUnique({ where: { id: BigInt(id) } });
    return plan ? mapPlan(plan) : undefined;
  },
  async create(input, actorId) {
    return mapPlan(
      await writePlan(actorId, (tx) => tx.plans.create({ data: planData(input) })),
    );
  },
  async update(id, input, actorId) {
    return writePlan(actorId, async (tx) => {
      const result = await tx.plans.updateMany({
        where: { id: BigInt(id) },
        data: { ...planData(input), updated_at: new Date() },
      });
      if (!result.count) {
        return undefined;
      }
      const plan = await tx.plans.findUniqueOrThrow({ where: { id: BigInt(id) } });
      return mapPlan(plan);
    });
  },
  async setActive(id, active, actorId) {
    return writePlan(actorId, async (tx) => {
      const result = await tx.plans.updateMany({
        where: { id: BigInt(id) },
        data: { is_active: active, updated_at: new Date() },
      });
      if (!result.count) {
        return undefined;
      }
      const plan = await tx.plans.findUniqueOrThrow({ where: { id: BigInt(id) } });
      return mapPlan(plan);
    });
  },
  async getActive() {
    return (
      await getPrisma().plans.findMany({
        where: { is_active: true },
        orderBy: [{ display_order: 'asc' }, { id: 'asc' }],
      })
    ).map(mapPlan);
  },
  async getActiveById(id) {
    const decimalId = id.trim();
    if (!/^[+-]?\d+$/.test(decimalId)) {
      return undefined;
    }

    const planId = BigInt(decimalId);
    if (planId < -9223372036854775808n || planId > 9223372036854775807n) {
      return undefined;
    }

    const plan = await getPrisma().plans.findFirst({
      where: { id: planId, is_active: true },
    });
    return plan ? mapPlan(plan) : undefined;
  },
};
