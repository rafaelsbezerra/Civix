-- ============================================================================
-- UP MIGRATION: 20261107000100_add_company_price_range
-- ============================================================================
BEGIN;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS price_range NUMRANGE;

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_price_range_non_empty_check;

ALTER TABLE companies
  ADD CONSTRAINT companies_price_range_non_empty_check
  CHECK (
    price_range IS NULL
    OR (
      NOT isempty(price_range)
      AND lower(price_range) >= 0
    )
  );

CREATE INDEX IF NOT EXISTS companies_state_idx ON companies (UPPER(state));
CREATE INDEX IF NOT EXISTS companies_price_range_gist_idx ON companies USING GIST (price_range);

INSERT INTO "_prisma_migrations" (
  "id",
  "checksum",
  "finished_at",
  "migration_name",
  "logs",
  "rolled_back_at",
  "started_at",
  "applied_steps_count"
)
SELECT
  gen_random_uuid()::text,
  'manual_sql_20261107000100_add_company_price_range',
  NOW(),
  '20261107000100_add_company_price_range',
  NULL,
  NULL,
  NOW(),
  1
WHERE to_regclass('public._prisma_migrations') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "_prisma_migrations"
    WHERE "migration_name" = '20261107000100_add_company_price_range'
      AND "rolled_back_at" IS NULL
  );

COMMIT;

-- ============================================================================
-- DOWN MIGRATION (consulte também ./down.sql para execução isolada)
-- ============================================================================
-- BEGIN;
-- DROP INDEX IF EXISTS companies_price_range_gist_idx;
-- DROP INDEX IF EXISTS companies_state_idx;
-- ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_price_range_non_empty_check;
-- ALTER TABLE companies DROP COLUMN IF EXISTS price_range;
-- DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261107000100_add_company_price_range';
-- COMMIT;


