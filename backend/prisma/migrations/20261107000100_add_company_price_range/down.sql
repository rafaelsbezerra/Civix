-- ============================================================================
-- DOWN MIGRATION: 20261107000100_add_company_price_range
-- ============================================================================
BEGIN;

DROP INDEX IF EXISTS companies_price_range_gist_idx;
DROP INDEX IF EXISTS companies_state_idx;

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_price_range_non_empty_check;

ALTER TABLE companies
  DROP COLUMN IF EXISTS price_range;

DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '20261107000100_add_company_price_range';
  END IF;
END $$;

COMMIT;

