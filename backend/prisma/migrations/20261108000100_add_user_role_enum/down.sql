BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_company_scope_check;

ALTER TABLE users
  ALTER COLUMN role TYPE TEXT
  USING LOWER(role::text);

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN ('admin_empresa', 'super_admin', 'cliente', 'atendente')
);

ALTER TABLE users ADD CONSTRAINT users_company_scope_check CHECK (
  (role IN ('admin_empresa', 'atendente') AND company_id IS NOT NULL)
  OR (role IN ('super_admin', 'cliente') AND company_id IS NULL)
);

DROP TYPE IF EXISTS user_role;

DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '20261108000100_add_user_role_enum';
  END IF;
END $$;

COMMIT;

