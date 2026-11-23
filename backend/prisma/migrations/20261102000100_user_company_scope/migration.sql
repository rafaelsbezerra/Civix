BEGIN;

ALTER TABLE users ADD COLUMN company_id UUID;
ALTER TABLE users ADD CONSTRAINT users_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE users ADD CONSTRAINT users_company_scope_check CHECK (
  (role IN ('admin_empresa', 'atendente') AND company_id IS NOT NULL)
  OR (role IN ('super_admin', 'cliente') AND company_id IS NULL)
);
CREATE INDEX users_company_id_idx ON users (company_id);

COMMIT;
