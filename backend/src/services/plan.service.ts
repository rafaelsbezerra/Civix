import type { Plan } from '../entities/plan.entity.js';
import { planRepository } from '../persistence/plan.repository.js';
import { userRepository } from '../persistence/user.repository.js';
import { toPlan } from '../persistence/plan.mapper.js';

export type { Plan, BillingPeriod } from '../entities/plan.entity.js';

export async function listActivePlans(): Promise<Plan[]> {
  return (await planRepository.getActive()).map(toPlan);
}

export async function assignPlanToUser(userId: string | number, planId: string): Promise<Plan | null> {
  const plan = await planRepository.getActiveById(planId);

  if (!plan) {
    return null;
  }

  const assigned = await userRepository.assignPlan(userId, plan.id);

  return assigned ? toPlan(plan) : null;
}