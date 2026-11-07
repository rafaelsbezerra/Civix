import type { Company } from '../entities/company.entity.js';
import type { UserId } from '../entities/user.entity.js';
import type { Sale } from '../entities/sale.entity.js';
import { z } from 'zod';

const manualSaleBase = {
  companyId: z.string().uuid(),
  operationId: z.string().uuid(),
  soldAt: z.string().datetime(),
};
export const manualSaleSchema = z.discriminatedUnion('pricingMode', [
  z
    .object({
      ...manualSaleBase,
      pricingMode: z.literal('company_plan'),
      description: z.string().trim().max(3000).optional(),
    })
    .strict(),
  z
    .object({
      ...manualSaleBase,
      pricingMode: z.literal('manual_amount'),
      amount: z.string(),
      description: z.string().trim().min(1).max(3000),
    })
    .strict(),
]);
export type ManualSaleInput = z.infer<typeof manualSaleSchema>;
export interface ManualSaleOperation {
  actorId: UserId;
  input: ManualSaleInput;
  fingerprint: string;
}
export interface SaleListFilters {
  companyId?: string;
  planId?: string;
  origin?: 'company_creation' | 'manual';
  from?: string;
  to?: string;
  offset: number;
  pageSize: number;
}

export interface CompanyRegistration {
  company: Company;
  planId: string;
  actorId: UserId;
  operationId: string;
  fingerprint: string;
}
export interface CompanyRegistrationResult {
  company: Company;
  sale: Sale;
  replayed: boolean;
}
