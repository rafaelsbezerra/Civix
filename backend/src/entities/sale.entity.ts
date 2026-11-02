import { z } from 'zod';

export const saleSchema = z.object({
  companyName: z.string().optional(), id: z.string().uuid(), companyId: z.string().uuid(), planId: z.string().nullable(),
  origin: z.enum(['company_creation', 'manual']), pricingMode: z.enum(['company_plan', 'manual_amount']),
  planName: z.string().nullable(), planPrice: z.string().nullable(),
  planBillingPeriod: z.enum(['monthly', 'yearly', 'one_time']).nullable(),
  amount: z.string(), currency: z.literal('BRL'), description: z.string().nullable(),
  soldAt: z.string().datetime(), createdAt: z.string().datetime(), createdBy: z.string(),
  operationId: z.string().uuid().nullable().optional(), fingerprint: z.string().length(64).nullable().optional(),
});
export type Sale = z.infer<typeof saleSchema>;
