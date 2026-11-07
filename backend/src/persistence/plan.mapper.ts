import type { Plan } from '../entities/plan.entity.js';
import type { PlanRow } from '../interfaces/plan.row.js';

function parseFeatures(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function parseLimits(value: unknown): Record<string, number | string | boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, item]) =>
      ['number', 'string', 'boolean'].includes(typeof item),
    ),
  ) as Record<string, number | string | boolean>;
}

export function toPlan(row: PlanRow): Plan {
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
