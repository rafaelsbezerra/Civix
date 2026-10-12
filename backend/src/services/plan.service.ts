import { logger } from '../shared/logging/log.context.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import type { Plan } from '../entities/plan.entity.js';
import { planRepository } from '../persistence/plan.repository.js';
import { userRepository } from '../persistence/user.repository.js';
import { toPlan } from '../persistence/plan.mapper.js';

export type { Plan, BillingPeriod } from '../entities/plan.entity.js';

export async function listActivePlans(): Promise<Plan[]> {
  const plans = (await planRepository.getActive()).map(toPlan);

  logger().debug({
    event: 'plans.listed',
    module: 'plans',
    message: 'Consulta de planos concluída',
    context: { count: plans.length, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return plans;
}

export async function assignPlanToUser(userId: string | number, planId: string): Promise<Plan | null> {
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
    context: { userId, planId: plan.id, persistenceMode: USE_MOCK_DATA ? 'json' : 'postgres' },
  });

  return assignedPlan;
}
