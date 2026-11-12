import { logger } from '../shared/logging/log.context.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import type { Plan } from '../entities/plan.entity.js';
import { planRepository } from '../persistence/index.js';
import { userRepository } from '../persistence/index.js';
import { toPlan } from '../persistence/plan.mapper.js';
import { z } from 'zod';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { getAuthenticatedUser } from './user.service.js';
import type { UserId } from '../entities/user.entity.js';

export function normalizePlanPrice(value: string): string {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Preço inválido. Informe reais com até duas casas decimais.',
    });
  }
  const [whole, fraction = ''] = value.split('.');
  if (BigInt(whole + fraction.padEnd(2, '0')) <= 0n) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'O preço do plano deve ser positivo.',
    });
  }
  return BigInt(whole).toString() + '.' + fraction.padEnd(2, '0');
}

export function validatePlanId(id: string): void {
  if (
    !id ||
    id.length > 128 ||
    (!USE_MOCK_DATA &&
      (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n))
  ) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Identificador de plano inválido.',
    });
  }
}

const planInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(3000),
    price: z.string(),
    billingPeriod: z.enum(['monthly', 'yearly', 'one_time']),
    features: z.array(z.string().trim().min(1).max(300)).max(100),
    limits: z.record(
      z.string(),
      z.union([z.string(), z.number().finite(), z.boolean()]),
    ),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
    displayOrder: z.number().int().min(-2147483648).max(2147483647),
  })
  .strict();

async function requirePlatformActor(actorId: UserId) {
  if ((await getAuthenticatedUser(actorId)).role !== 'super_admin') {
    throw new AppError({
      status: 403,
      code: ErrorCode.FORBIDDEN,
      message: 'Acesso exclusivo da administração da Civix.',
    });
  }
}
function requirePlan(row: Awaited<ReturnType<typeof planRepository.getById>>) {
  if (!row) {
    throw new AppError({
      status: 404,
      code: ErrorCode.NOT_FOUND,
      message: 'Plano não encontrado.',
    });
  }
  return toPlan(row);
}
export async function listPlatformPlans(actorId: UserId) {
  await requirePlatformActor(actorId);
  return (await planRepository.getAll()).map(toPlan);
}
export async function getPlatformPlan(actorId: UserId, id: string) {
  await requirePlatformActor(actorId);
  validatePlanId(id);
  return requirePlan(await planRepository.getById(id));
}
export async function savePlatformPlan(actorId: UserId, input: unknown, id?: string) {
  await requirePlatformActor(actorId);
  if (id !== undefined) {
    validatePlanId(id);
  }
  const parsed = planInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Dados do plano inválidos.',
    });
  }
  const value = { ...parsed.data, price: normalizePlanPrice(parsed.data.price) };
  return requirePlan(
    id
      ? await planRepository.update(id, value, actorId)
      : await planRepository.create(value, actorId),
  );
}
export async function activatePlatformPlan(
  actorId: UserId,
  id: string,
  input: unknown,
) {
  await requirePlatformActor(actorId);
  validatePlanId(id);
  const parsed = z.object({ active: z.boolean() }).strict().safeParse(input);
  if (!parsed.success) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Estado do plano inválido.',
    });
  }
  if (parsed.data.active) {
    normalizePlanPrice(requirePlan(await planRepository.getById(id)).price);
  }
  return requirePlan(await planRepository.setActive(id, parsed.data.active, actorId));
}

export type { Plan, BillingPeriod } from '../entities/plan.entity.js';

export async function listActivePlans(): Promise<Plan[]> {
  const plans = (await planRepository.getActive()).map(toPlan);

  logger().debug({
    event: 'plans.listed',
    module: 'plans',
    message: 'Consulta de planos concluída',
    context: {
      count: plans.length,
      persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres',
    },
  });

  return plans;
}

export async function assignPlanToUser(
  userId: string | number,
  planId: string,
): Promise<Plan | null> {
  const plan = await planRepository.getActiveById(planId);

  if (!plan) {
    return null;
  }

  const assigned = await userRepository.assignPlan(userId, plan.id);

  if (!assigned) {
    return null;
  }

  const assignedPlan = toPlan(plan);

  logger().info({
    event: 'plan.assigned',
    module: 'plans',
    message: 'Plano atribuído ao usuário',
    context: {
      userId,
      planId: plan.id,
      persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres',
    },
  });

  return assignedPlan;
}
