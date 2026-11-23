-- ============================================================================
-- UP MIGRATION: 20261107000200_standardize_columns_sales_numeric_and_status_enums
-- ============================================================================
BEGIN;

-- 1. Renomear tax_id para cnpj em companies mantendo dados e unicidade
ALTER TABLE companies RENAME COLUMN tax_id TO cnpj;
ALTER TABLE companies RENAME CONSTRAINT companies_tax_id_key TO companies_cnpj_key;

-- 2. Garantir created_at e updated_at em users e companies
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE companies
SET created_at = NOW()
WHERE created_at IS NULL;

ALTER TABLE companies
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Ajustar valores monetários de venda para NUMERIC(10, 2)
ALTER TABLE sales
  ALTER COLUMN plan_price TYPE NUMERIC(10, 2) USING ROUND(plan_price, 2),
  ALTER COLUMN amount TYPE NUMERIC(10, 2) USING ROUND(amount, 2);

-- 4. Converter status de users e companies para ENUMs em UPPER CASE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'PENDING', 'BLOCKED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_status') THEN
    CREATE TYPE company_status AS ENUM ('ATIVO', 'INATIVO', 'VERIFICADO');
  END IF;
END $$;

UPDATE users
SET status = 'ACTIVE'
WHERE status IS NULL OR TRIM(status::text) = '';

ALTER TABLE users
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE user_status
  USING (
    CASE UPPER(TRIM(status::text))
      WHEN 'ACTIVE' THEN 'ACTIVE'::user_status
      WHEN 'PENDING' THEN 'PENDING'::user_status
      WHEN 'BLOCKED' THEN 'BLOCKED'::user_status
      ELSE 'ACTIVE'::user_status
    END
  ),
  ALTER COLUMN status SET DEFAULT 'ACTIVE'::user_status,
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_status_check;

ALTER TABLE companies
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE company_status
  USING (
    CASE UPPER(TRIM(status::text))
      WHEN 'ATIVO' THEN 'ATIVO'::company_status
      WHEN 'INATIVO' THEN 'INATIVO'::company_status
      WHEN 'VERIFICADO' THEN 'VERIFICADO'::company_status
      ELSE 'ATIVO'::company_status
    END
  ),
  ALTER COLUMN status SET DEFAULT 'ATIVO'::company_status,
  ALTER COLUMN status SET NOT NULL;

-- 5. Registrar aplicação na tabela _prisma_migrations (para execuções manuais via SQL)
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
  'manual_sql_20261107000200_standardize_columns_sales_numeric_and_status_enums',
  NOW(),
  '20261107000200_standardize_columns_sales_numeric_and_status_enums',
  NULL,
  NULL,
  NOW(),
  1
WHERE to_regclass('public._prisma_migrations') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "_prisma_migrations"
    WHERE "migration_name" = '20261107000200_standardize_columns_sales_numeric_and_status_enums'
      AND "rolled_back_at" IS NULL
  );

COMMIT;

-- ============================================================================
-- DOWN MIGRATION (consulte também ./down.sql para execução isolada)
-- ============================================================================
-- BEGIN;
-- ALTER TABLE companies
--   ALTER COLUMN status DROP DEFAULT,
--   ALTER COLUMN status TYPE TEXT USING LOWER(status::text),
--   ADD CONSTRAINT companies_status_check CHECK (status IN ('ativo', 'inativo', 'verificado'));
-- ALTER TABLE users
--   ALTER COLUMN status DROP DEFAULT,
--   ALTER COLUMN status DROP NOT NULL,
--   ALTER COLUMN status TYPE TEXT USING LOWER(status::text);
-- DROP TYPE IF EXISTS company_status;
-- DROP TYPE IF EXISTS user_status;
-- ALTER TABLE sales
--   ALTER COLUMN plan_price TYPE NUMERIC(12, 2),
--   ALTER COLUMN amount TYPE NUMERIC(12, 2);
-- ALTER TABLE companies
--   DROP COLUMN IF EXISTS updated_at,
--   ALTER COLUMN created_at DROP DEFAULT,
--   ALTER COLUMN created_at DROP NOT NULL;
-- ALTER TABLE users
--   DROP COLUMN IF EXISTS updated_at,
--   DROP COLUMN IF EXISTS created_at;
-- ALTER TABLE companies RENAME CONSTRAINT companies_cnpj_key TO companies_tax_id_key;
-- ALTER TABLE companies RENAME COLUMN cnpj TO tax_id;
-- DELETE FROM "_prisma_migrations"
-- WHERE "migration_name" = '20261107000200_standardize_columns_sales_numeric_and_status_enums';
-- COMMIT;


