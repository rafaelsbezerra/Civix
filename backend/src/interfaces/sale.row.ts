export interface SaleRow {
  company_name?: string;
  operation_id?: string | null;
  fingerprint?: string | null;
  id: string; company_id: string; plan_id: string | number | null;
  origin: 'company_creation' | 'manual'; pricing_mode: 'company_plan' | 'manual_amount';
  plan_name: string | null; plan_price: string | null;
  plan_billing_period: 'monthly' | 'yearly' | 'one_time' | null;
  amount: string; currency: 'BRL'; description: string | null;
  sold_at: Date | string; created_at: Date | string; created_by: string;
}
