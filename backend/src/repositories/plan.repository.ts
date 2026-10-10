import type { Plan } from '../entities/plan.entity.js';

/** A atribuição de plano ao usuário pertence ao contrato UserRepository. */
export interface PlanRepository {
  getActive(): Promise<Plan[]>;
  getActiveById(id: string): Promise<Plan | undefined>;
}
