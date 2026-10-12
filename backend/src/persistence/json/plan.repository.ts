import type { PlanRepository } from '../../repositories/plan.repository.js';
import { readLocalData } from './local.store.js';

export const planJsonRepository: PlanRepository = {
  async getActive() {
    return (await readLocalData()).plans
      .filter(plan => plan.is_active)
      .sort((left, right) => left.display_order - right.display_order
        || String(left.id).localeCompare(String(right.id), undefined, { numeric: true }));
  },

  async getActiveById(id) {
    const plan = (await readLocalData()).plans.find(plan => String(plan.id) === id && plan.is_active);

    return plan;
  },
};