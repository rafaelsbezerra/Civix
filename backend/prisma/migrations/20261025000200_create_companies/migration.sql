BEGIN;

CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  tax_id TEXT NOT NULL,
  description TEXT NOT NULL,
  detailed_description TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo', 'verificado')),
  is_verified BOOLEAN NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('pequena', 'media', 'grande')),
  created_at TIMESTAMPTZ,
  logo TEXT,
  cover_key TEXT,
  logo_key TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  whatsapp TEXT,
  additional_description TEXT,
  tone TEXT CHECK (tone IN ('blue', 'green', 'orange', 'purple', 'gray')),
  CONSTRAINT companies_tax_id_key UNIQUE (tax_id)
);

CREATE UNIQUE INDEX companies_email_unique_idx ON companies (LOWER(email));

COMMIT;
