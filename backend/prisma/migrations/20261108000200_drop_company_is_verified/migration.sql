-- ============================================================================
-- UP MIGRATION: 20261108000200_drop_company_is_verified
-- ============================================================================
BEGIN;

ALTER TABLE companies
  DROP COLUMN IF EXISTS is_verified;

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
  'manual_sql_20261108000200_drop_company_is_verified',
  NOW(),
  '20261108000200_drop_company_is_verified',
  NULL,
  NULL,
  NOW(),
  1
WHERE to_regclass('public._prisma_migrations') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "_prisma_migrations"
    WHERE "migration_name" = '20261108000200_drop_company_is_verified'
      AND "rolled_back_at" IS NULL
  );

COMMIT;

-- ============================================================================
-- DOWN MIGRATION (consulte também ./down.sql para execução isolada)
-- ============================================================================
-- BEGIN;
-- ALTER TABLE companies
--   ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
-- DO $$
-- BEGIN
--   IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
--     DELETE FROM "_prisma_migrations"
--     WHERE "migration_name" = '20261108000200_drop_company_is_verified';
--   END IF;
-- END $$;
-- COMMIT;

