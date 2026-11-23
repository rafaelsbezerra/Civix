import type { PlanRow } from '../interfaces/plan.row.js';
import type { PlanInput } from '../entities/plan.entity.js';
import type { UserId } from '../entities/user.entity.js';

/** Linhas de persistência; a atribuição ao usuário pertence a UserRepository. */
export interface PlanRepository {
  getAll(): Promise<PlanRow[]>;
  getById(id: string): Promise<PlanRow | undefined>;
  create(input: PlanInput, actorId: UserId): Promise<PlanRow>;
  update(id: string, input: PlanInput, actorId: UserId): Promise<PlanRow | undefined>;
  setActive(id: string, active: boolean, actorId: UserId): Promise<PlanRow | undefined>;
  getActive(): Promise<PlanRow[]>;
  getActiveById(id: string): Promise<PlanRow | undefined>;
}
