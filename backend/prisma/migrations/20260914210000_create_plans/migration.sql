CREATE TABLE IF NOT EXISTS plans (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly', 'one_time')),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS plans_active_order_idx
  ON plans (is_active, display_order, id);

INSERT INTO plans (name, slug, description, price, billing_period, features, limits, is_featured, display_order)
VALUES
  ('Plano Inicial', 'inicial', 'Presenca profissional para comecar a crescer.', 0, 'monthly', '["Perfil no catalogo", "Contato de clientes"]'::jsonb, '{"leads_per_month": 10}'::jsonb, false, 10),
  ('Plano Profissional', 'profissional', 'Mais visibilidade e recursos para sua empresa.', 59.90, 'monthly', '["Perfil em destaque", "Contato de clientes", "Relatorios basicos"]'::jsonb, '{"leads_per_month": 100}'::jsonb, true, 20),
  ('Plano Premium', 'premium', 'Recursos completos para operar em escala.', 99.90, 'monthly', '["Perfil em destaque", "Relatorios avancados", "Suporte prioritario"]'::jsonb, '{"leads_per_month": -1}'::jsonb, false, 30)
ON CONFLICT (slug) DO NOTHING;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id BIGINT;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_id_fkey;
    ALTER TABLE users ADD CONSTRAINT users_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS users_plan_id_idx ON users (plan_id);
  END IF;
END $$;
