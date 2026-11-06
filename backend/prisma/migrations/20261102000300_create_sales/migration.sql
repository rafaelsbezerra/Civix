BEGIN;
CREATE TABLE sales (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  plan_id BIGINT REFERENCES plans(id),
  origin TEXT NOT NULL CHECK (origin IN ('company_creation', 'manual')),
  pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('company_plan', 'manual_amount')),
  plan_name TEXT,
  plan_price NUMERIC(12,2),
  plan_billing_period TEXT CHECK (plan_billing_period IN ('monthly', 'yearly', 'one_time')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  description TEXT,
  sold_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  operation_id UUID,
  fingerprint TEXT CHECK (fingerprint IS NULL OR fingerprint ~ '^[0-9a-f]{64}$'),
  CHECK ((operation_id IS NULL) = (fingerprint IS NULL)),
  CHECK (pricing_mode <> 'manual_amount' OR description IS NOT NULL AND length(trim(description)) > 0),
  CHECK (pricing_mode <> 'company_plan' OR plan_id IS NOT NULL AND plan_name IS NOT NULL
    AND plan_price IS NOT NULL AND plan_billing_period IS NOT NULL AND amount = plan_price)
);
CREATE UNIQUE INDEX sales_initial_company_key ON sales (company_id) WHERE origin = 'company_creation';
CREATE INDEX sales_company_id_idx ON sales (company_id);
CREATE UNIQUE INDEX sales_manual_operation_key ON sales (created_by, operation_id) WHERE operation_id IS NOT NULL;
CREATE TABLE company_registration_operations (
  actor_id UUID NOT NULL REFERENCES users(id),
  operation_id UUID NOT NULL,
  fingerprint TEXT NOT NULL CHECK (length(fingerprint) = 64),
  company_id UUID NOT NULL REFERENCES companies(id),
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (actor_id, operation_id)
);
COMMIT;
