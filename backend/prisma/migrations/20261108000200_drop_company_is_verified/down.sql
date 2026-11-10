BEGIN;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '20261108000200_drop_company_is_verified';
  END IF;
END $$;

COMMIT;

