-- ============================================================================
-- DOWN MIGRATION: 20261107000200_standardize_columns_sales_numeric_and_status_enums
-- ============================================================================
BEGIN;

-- 1. Reverter status de companies e users de ENUM para TEXT
ALTER TABLE companies
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE TEXT USING LOWER(status::text),
  ADD CONSTRAINT companies_status_check CHECK (status IN ('ativo', 'inativo', 'verificado'));

ALTER TABLE users
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status DROP NOT NULL,
  ALTER COLUMN status TYPE TEXT USING LOWER(status::text);

DROP TYPE IF EXISTS company_status;
DROP TYPE IF EXISTS user_status;

-- 2. Reverter valores monetários de sales para NUMERIC(12, 2)
ALTER TABLE sales
  ALTER COLUMN plan_price TYPE NUMERIC(12, 2),
  ALTER COLUMN amount TYPE NUMERIC(12, 2);

-- 3. Reverter colunas created_at e updated_at em companies e users
ALTER TABLE companies
  DROP COLUMN IF EXISTS updated_at,
  ALTER COLUMN created_at DROP DEFAULT,
  ALTER COLUMN created_at DROP NOT NULL;

ALTER TABLE users
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS created_at;

-- 4. Reverter cnpj para tax_id em companies
ALTER TABLE companies RENAME CONSTRAINT companies_cnpj_key TO companies_tax_id_key;
ALTER TABLE companies RENAME COLUMN cnpj TO tax_id;

-- 5. Remover registro da migration na tabela _prisma_migrations
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '20261107000200_standardize_columns_sales_numeric_and_status_enums';
  END IF;
END $$;

COMMIT;

