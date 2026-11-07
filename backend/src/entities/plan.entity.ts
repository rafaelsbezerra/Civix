export type BillingPeriod = 'monthly' | 'yearly' | 'one_time';
export type PlanInput = Omit<Plan, 'id'>;

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  billingPeriod: BillingPeriod;
  features: string[];
  limits: Record<string, number | string | boolean>;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
}
