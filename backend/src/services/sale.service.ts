import { randomUUID } from 'node:crypto';
import type { PlanRow } from '../interfaces/plan.row.js';
import type { Sale } from '../entities/sale.entity.js';
import type { UserId } from '../entities/user.entity.js';
import { normalizePlanPrice } from './plan.service.js';

export function createInitialSale(companyId: string, plan: PlanRow, actorId: UserId): Sale {
  const now = new Date().toISOString();
  const amount = normalizePlanPrice(String(plan.price));
  return { id: randomUUID(), companyId, planId: String(plan.id), origin: 'company_creation',
    pricingMode: 'company_plan', planName: plan.name, planPrice: amount,
    planBillingPeriod: plan.billing_period, amount, currency: 'BRL', description: null,
    soldAt: now, createdAt: now, createdBy: String(actorId) };
}
