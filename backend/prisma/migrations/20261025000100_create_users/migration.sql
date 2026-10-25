BEGIN;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('empresa', 'cliente')),
  password_hash TEXT,
  status TEXT,
  invite_token TEXT,
  reset_password_token TEXT,
  reset_password_expires TIMESTAMPTZ,
  plan_id BIGINT,
  CONSTRAINT users_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX users_email_unique_idx ON users (LOWER(email));
CREATE INDEX users_plan_id_idx ON users (plan_id);

COMMIT;
