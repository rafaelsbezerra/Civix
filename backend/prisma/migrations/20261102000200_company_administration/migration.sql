BEGIN;
ALTER TABLE companies ADD COLUMN plan_id BIGINT REFERENCES plans(id);
ALTER TABLE companies ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN deactivation_reason TEXT;
ALTER TABLE companies ADD COLUMN deactivated_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN deactivated_by UUID REFERENCES users(id);
ALTER TABLE companies ADD CONSTRAINT companies_deactivation_reason_check
  CHECK (deactivation_reason IS NULL OR length(trim(deactivation_reason)) > 0);
CREATE INDEX companies_plan_id_idx ON companies (plan_id);
COMMIT;
