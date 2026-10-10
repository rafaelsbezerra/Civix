import { db } from '../shared/config/data.js';

import type { Plan } from '../entities/plan.entity.js';
import type { PlanRow } from '../interfaces/plan.row.js';
export type { Plan, BillingPeriod } from '../entities/plan.entity.js';

function parseFeatures(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function parseLimits(value: unknown): Record<string, number | string | boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => ['number', 'string', 'boolean'].includes(typeof item)),
  ) as Record<string, number | string | boolean>;
}

function toPlan(row: PlanRow): Plan {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: String(row.price),
    billingPeriod: row.billing_period,
    features: parseFeatures(row.features),
    limits: parseLimits(row.limits),
    isFeatured: row.is_featured,
    isActive: row.is_active,
    displayOrder: row.display_order,
  };
}

export async function listActivePlans(): Promise<Plan[]> {
  const result = await db.query<PlanRow>(`
    SELECT id, name, slug, description, price, billing_period,
           features, limits, is_featured, is_active, display_order
    FROM plans
    WHERE is_active = TRUE
    ORDER BY display_order ASC, id ASC
  `);

  return result.rows.map(toPlan);
}

export async function assignPlanToUser(userId: string | number, planId: string): Promise<Plan | null> {
  const planResult = await db.query<PlanRow>(`
    SELECT id, name, slug, description, price, billing_period,
           features, limits, is_featured, is_active, display_order
    FROM plans
    WHERE id = $1 AND is_active = TRUE
  `, [planId]);

  const plan = planResult.rows[0];
  if (!plan) return null;

  const userResult = await db.query(
    'UPDATE users SET plan_id = $1 WHERE id = $2 RETURNING id',
    [plan.id, userId],
  );

  if (userResult.rowCount !== 1) return null;
  return toPlan(plan);
}
