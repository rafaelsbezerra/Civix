import type { PlanRepository } from '../../repositories/plan.repository.js';
import { readLocalData, updateLocalData } from './local.store.js';
import { randomUUID } from 'node:crypto';
import type { PlanInput } from '../../entities/plan.entity.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import type { User, UserId } from '../../entities/user.entity.js';

function requirePlanActor(users: readonly User[], actorId: UserId) {
  const actor = users.find(user => String(user.id) === String(actorId));
  if (!actor || actor.role !== 'super_admin' || actor.company_id !== null || !actor.password_hash || actor.deleted_at || actor.status != null && actor.status !== 'active') throw new AppError({ status:403,code:ErrorCode.FORBIDDEN,message:'Acesso administrativo alterado.' });
}

function toRow(input: PlanInput) {
  return { name: input.name, slug: input.slug, description: input.description, price: input.price,
    billing_period: input.billingPeriod, features: input.features, limits: input.limits,
    is_featured: input.isFeatured, is_active: input.isActive, display_order: input.displayOrder };
}

export const planJsonRepository: PlanRepository = {
  async getAll() {
    return (await readLocalData()).plans.sort((a, b) => a.display_order - b.display_order || String(a.id).localeCompare(String(b.id)));
  },
  async getById(id) { return (await readLocalData()).plans.find(plan => String(plan.id) === id); },
  async create(input, actorId) {
    return updateLocalData(data => {
      requirePlanActor(data.users,actorId);
      if (data.plans.some(plan => plan.slug === input.slug)) throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'Identificador do plano já cadastrado.' });
      const plan = { id: randomUUID(), ...toRow(input) };
      data.plans.push(plan);
      return plan;
    });
  },
  async update(id, input, actorId) {
    return updateLocalData(data => {
      requirePlanActor(data.users,actorId);
      const plan = data.plans.find(item => String(item.id) === id);
      if (!plan) return undefined;
      if (data.plans.some(item => String(item.id) !== id && item.slug === input.slug)) throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'Identificador do plano já cadastrado.' });
      Object.assign(plan, toRow(input));
      return plan;
    });
  },
  async setActive(id, active, actorId) {
    return updateLocalData(data => {
      requirePlanActor(data.users,actorId);
      const plan = data.plans.find(item => String(item.id) === id);
      if (plan) plan.is_active = active;
      return plan;
    });
  },
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
