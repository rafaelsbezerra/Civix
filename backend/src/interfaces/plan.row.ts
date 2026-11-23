import type { BillingPeriod } from '../entities/plan.entity.js';

export interface PlanRow {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  price: string | number;
  billing_period: BillingPeriod;
  features: unknown;
  limits: unknown;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
}
