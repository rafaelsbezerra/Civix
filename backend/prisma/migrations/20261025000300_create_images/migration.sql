BEGIN;

CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10000000),
  module TEXT NOT NULL,
  resource_id UUID NOT NULL,
  purpose TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX images_resource_idx ON images (module, resource_id, purpose);

ALTER TABLE companies ADD CONSTRAINT companies_cover_key_fkey
  FOREIGN KEY (cover_key) REFERENCES images(object_key);

ALTER TABLE companies ADD CONSTRAINT companies_logo_key_fkey
  FOREIGN KEY (logo_key) REFERENCES images(object_key);

COMMIT;
