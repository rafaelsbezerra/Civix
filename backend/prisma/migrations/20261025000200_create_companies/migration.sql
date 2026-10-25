BEGIN;

CREATE TABLE empresas (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  descricao TEXT NOT NULL,
  descricao_detalhada TEXT NOT NULL,
  categoria TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo', 'verificado')),
  verificado BOOLEAN NOT NULL,
  tamanho TEXT NOT NULL CHECK (tamanho IN ('pequena', 'media', 'grande')),
  data_cadastro TIMESTAMPTZ,
  logo TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  website TEXT,
  whatsapp TEXT,
  descritivo TEXT,
  tone TEXT CHECK (tone IN ('blue', 'green', 'orange', 'purple', 'gray')),
  CONSTRAINT empresas_cnpj_key UNIQUE (cnpj)
);

CREATE UNIQUE INDEX empresas_email_unique_idx ON empresas (LOWER(email));

COMMIT;
