import type { SaleRow } from '../interfaces/sale.row.js';
import type { Sale } from '../entities/sale.entity.js';
export function toSale(row: SaleRow): Sale {
  return {
    ...(row.company_name ? { companyName: row.company_name } : {}),
    operationId: row.operation_id ?? null,
    fingerprint: row.fingerprint ?? null,
    id: row.id,
    companyId: row.company_id,
    planId: row.plan_id == null ? null : String(row.plan_id),
    origin: row.origin,
    pricingMode: row.pricing_mode,
    planName: row.plan_name,
    planPrice: row.plan_price,
    planBillingPeriod: row.plan_billing_period,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    soldAt: new Date(row.sold_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    createdBy: row.created_by,
  };
}
