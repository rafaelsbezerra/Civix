BEGIN;

-- 1. Criar o tipo ENUM user_role em UPPER CASE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'ADMIN_EMPRESA',
      'SUPER_ADMIN',
      'CLIENTE',
      'ATENDENTE'
    );
  END IF;
END $$;

-- 2. Remover constraints que dependem de users.role como TEXT em lowercase
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_company_scope_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 3. Converter users.role para user_role preservando os dados existentes
ALTER TABLE users
  ALTER COLUMN role TYPE user_role
  USING (
    CASE UPPER(TRIM(role::text))
      WHEN 'ADMIN_EMPRESA' THEN 'ADMIN_EMPRESA'::user_role
      WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::user_role
      WHEN 'CLIENTE' THEN 'CLIENTE'::user_role
      WHEN 'ATENDENTE' THEN 'ATENDENTE'::user_role
      ELSE 'CLIENTE'::user_role
    END
  );

-- 4. Recriar a constraint de escopo empresarial usando o enum em UPPER CASE
ALTER TABLE users ADD CONSTRAINT users_company_scope_check CHECK (
  (role IN ('ADMIN_EMPRESA'::user_role, 'ATENDENTE'::user_role) AND company_id IS NOT NULL)
  OR (role IN ('SUPER_ADMIN'::user_role, 'CLIENTE'::user_role) AND company_id IS NULL)
);

-- 5. Registrar a migration em _prisma_migrations (idempotente para execução manual via SQL)
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
  'manual_sql_20261108000100_add_user_role_enum',
  NOW(),
  '20261108000100_add_user_role_enum',
  NULL,
  NULL,
  NOW(),
  1
WHERE to_regclass('public._prisma_migrations') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "_prisma_migrations"
    WHERE "migration_name" = '20261108000100_add_user_role_enum'
      AND "rolled_back_at" IS NULL
  );

COMMIT;

-- ============================================================================
-- DOWN (Reversão manual — também disponível em ./down.sql)
-- ============================================================================
-- BEGIN;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_company_scope_check;
-- ALTER TABLE users ALTER COLUMN role TYPE TEXT USING LOWER(role::text);
-- ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
--   role IN ('admin_empresa', 'super_admin', 'cliente', 'atendente')
-- );
-- ALTER TABLE users ADD CONSTRAINT users_company_scope_check CHECK (
--   (role IN ('admin_empresa', 'atendente') AND company_id IS NOT NULL)
--   OR (role IN ('super_admin', 'cliente') AND company_id IS NULL)
-- );
-- DROP TYPE IF EXISTS user_role;
-- DO $$
-- BEGIN
--   IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
--     DELETE FROM "_prisma_migrations"
--     WHERE "migration_name" = '20261108000100_add_user_role_enum';
--   END IF;
-- END $$;
-- COMMIT;

