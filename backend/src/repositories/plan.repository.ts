import type { PlanRow } from '../interfaces/plan.row.js';

/** Linhas de persistência; a atribuição ao usuário pertence a UserRepository. */
export interface PlanRepository {
  getActive(): Promise<PlanRow[]>;
  getActiveById(id: string): Promise<PlanRow | undefined>;
}