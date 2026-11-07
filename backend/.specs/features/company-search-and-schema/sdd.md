# SDD — Busca pública de empresas e evolução de schema

Data: 2026-11-07  
Arquivos da spec: [Feature](feature.md) · [SDD](sdd.md) · [Tasks](tasks.md)  
Par frontend: [`frontend/.specs/features/company-search-and-schema/sdd.md`](../../../../frontend/.specs/features/company-search-and-schema/sdd.md)

## 1. Arquitetura e camadas afetadas

A implementação mantém a arquitetura em camadas do projeto (`routes → controller → service → repository → persistence/{postgres,json}`):

| Camada | Arquivos | Responsabilidade |
| --- | --- | --- |
| Rotas | [`backend/src/app.ts`](../../../src/app.ts), [`backend/src/routes/company.routes.ts`](../../../src/routes/company.routes.ts) | Montar `/api/v1/companies` (mantendo `/api/v1/empresas`) e expor `GET /search` |
| Controller | [`backend/src/controller/company.controller.ts`](../../../src/controller/company.controller.ts) | Extrair query params (`q`, `uf`, `priceRange`) e retornar envelope `createSuccessResponse` |
| Service | [`backend/src/services/company.service.ts`](../../../src/services/company.service.ts) | Validar combinações de filtros com Zod, delegar ao repositório e aplicar `presentCompany` |
| Entidades e DTOs | [`backend/src/entities/company.entity.ts`](../../../src/entities/company.entity.ts), [`backend/src/entities/user.entity.ts`](../../../src/entities/user.entity.ts), [`backend/src/dtos/company.create.dto.ts`](../../../src/dtos/company.create.dto.ts) | Definir `CompanyPriceRange`, `BRAZIL_UFS`, `faixa_preco`, `createdAt`/`updatedAt` e schemas de busca/criação |
| Repositório e Persistência | [`backend/src/repositories/company.repository.ts`](../../../src/repositories/company.repository.ts), [`backend/src/persistence/postgres/company.repository.ts`](../../../src/persistence/postgres/company.repository.ts), [`backend/src/persistence/json/company.repository.ts`](../../../src/persistence/json/company.repository.ts) | Executar consultas por nome e/ou UF + `numrange`, mapear `cnpj`, `price_range`, `created_at`/`updated_at` e status |
| Schema e Migrations | [`backend/prisma/schema.prisma`](../../../prisma/schema.prisma), `backend/prisma/migrations/*` | Versionar as 2 migrations SQL nativas e manter o schema Prisma sincronizado |

---

## 2. Fluxo 1 — Consulta `GET /api/v1/companies/search`

1. **Entrada:**
   - Query string: `q` (string opcional), `uf` (string opcional), `priceRange` (string opcional).
2. **Validação (`companySearchQuerySchema` em `company.create.dto.ts`):**
   - `BRAZIL_UFS`: `['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']`.
   - `COMPANY_PRICE_RANGES`: `['0-100', '100-300', '300-500', '500-plus']`.
   - Regra de combinação:
     - Pelo menos `q` (não vazio) **ou** o par completo (`uf` + `priceRange`) deve estar presente.
     - Se `uf` for informado sem `priceRange`, ou `priceRange` sem `uf`, lançar `AppError` com `400 VALIDATION_ERROR`.
3. **Caso de uso (`companyService.searchCompaniesByFilters`):**
   - Normaliza `uf` para uppercase.
   - Chama `companyRepository.searchPublicCompanies({ q, uf, priceRange })`.
   - Filtra empresas elegíveis (ativas/verificadas e não arquivadas) e aplica `presentCompany`.
4. **Persistência:**
   - **Mapeamento `priceRange` ↔ PostgreSQL `numrange`:**
     - `'0-100'` ↔ `'[0,100]'`
     - `'100-300'` ↔ `'[100,300]'`
     - `'300-500'` ↔ `'[300,500]'`
     - `'500-plus'` ↔ `'[500,)'`
   - **SQL (`companyPostgresRepository.searchPublicCompanies`):**
     ```sql
     SELECT id, name AS nome, cnpj, description AS descricao,
            detailed_description AS descricao_detalhada, category AS categoria,
            city AS cidade, state AS estado, LOWER(status::text) AS status,
            is_verified AS verificado, size AS tamanho,
            created_at AS data_cadastro, created_at AS "createdAt", updated_at AS "updatedAt",
            CASE
              WHEN price_range IS NULL THEN NULL
              WHEN lower(price_range) = 0 AND upper(price_range) = 100 THEN '0-100'
              WHEN lower(price_range) = 100 AND upper(price_range) = 300 THEN '100-300'
              WHEN lower(price_range) = 300 AND upper(price_range) = 500 THEN '300-500'
              WHEN lower(price_range) = 500 AND upper_inf(price_range) THEN '500-plus'
              ELSE NULL
            END AS faixa_preco,
            logo, address AS endereco, phone AS telefone, email, website, whatsapp,
            additional_description AS descritivo, tone, cover_key, logo_key,
            plan_id, deleted_at, deactivation_reason, deactivated_at, deactivated_by
     FROM companies
     WHERE deleted_at IS NULL
       AND UPPER(status::text) <> 'INATIVO'
       -- + filtros dinâmicos:
       -- AND name ILIKE $1
       -- AND UPPER(state) = UPPER($2) AND price_range IS NOT NULL AND price_range && $3::numrange
     ```
5. **Resposta:**
   - `200 OK` com `{ data: PublicCompany[] }`.

---

## 3. Fluxo 2 — Migrations SQL e Schema Prisma

Cada migration possui o script de **UP** em `migration.sql` (com `INSERT` idempotente em `_prisma_migrations` para suportar execução manual via query SQL direta no banco) e o script de **DOWN** em `down.sql` (além do bloco DOWN comentado ao final de `migration.sql`, com `DELETE` em `_prisma_migrations`).

### 3.1. Migration 1: `20261107000100_add_company_price_range` (`migration.sql` + `down.sql`)

```sql
-- UP (migration.sql)
BEGIN;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS price_range NUMRANGE;

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_price_range_non_empty_check;

ALTER TABLE companies
  ADD CONSTRAINT companies_price_range_non_empty_check
  CHECK (
    price_range IS NULL
    OR (
      NOT isempty(price_range)
      AND lower(price_range) >= 0
    )
  );

CREATE INDEX IF NOT EXISTS companies_state_idx ON companies (UPPER(state));
CREATE INDEX IF NOT EXISTS companies_price_range_gist_idx ON companies USING GIST (price_range);

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
  'manual_sql_20261107000100_add_company_price_range',
  NOW(),
  '20261107000100_add_company_price_range',
  NULL,
  NULL,
  NOW(),
  1
WHERE to_regclass('public._prisma_migrations') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "_prisma_migrations"
    WHERE "migration_name" = '20261107000100_add_company_price_range'
      AND "rolled_back_at" IS NULL
  );

COMMIT;
```

```sql
-- DOWN (down.sql)
BEGIN;

DROP INDEX IF EXISTS companies_price_range_gist_idx;
DROP INDEX IF EXISTS companies_state_idx;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_price_range_non_empty_check;
ALTER TABLE companies DROP COLUMN IF EXISTS price_range;

DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '20261107000100_add_company_price_range';
  END IF;
END $$;

COMMIT;
```

### 3.2. Migration 2: `20261107000200_standardize_columns_sales_numeric_and_status_enums` (`migration.sql` + `down.sql`)

```sql
-- UP (migration.sql)
BEGIN;

ALTER TABLE companies RENAME COLUMN tax_id TO cnpj;
ALTER TABLE companies RENAME CONSTRAINT companies_tax_id_key TO companies_cnpj_key;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE companies SET created_at = NOW() WHERE created_at IS NULL;

ALTER TABLE companies
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE sales
  ALTER COLUMN plan_price TYPE NUMERIC(10, 2) USING ROUND(plan_price, 2),
  ALTER COLUMN amount TYPE NUMERIC(10, 2) USING ROUND(amount, 2);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'PENDING', 'BLOCKED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_status') THEN
    CREATE TYPE company_status AS ENUM ('ATIVO', 'INATIVO', 'VERIFICADO');
  END IF;
END $$;

UPDATE users SET status = 'ACTIVE' WHERE status IS NULL OR TRIM(status::text) = '';

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
```

```sql
-- DOWN (down.sql)
BEGIN;

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

ALTER TABLE sales
  ALTER COLUMN plan_price TYPE NUMERIC(12, 2),
  ALTER COLUMN amount TYPE NUMERIC(12, 2);

ALTER TABLE companies
  DROP COLUMN IF EXISTS updated_at,
  ALTER COLUMN created_at DROP DEFAULT,
  ALTER COLUMN created_at DROP NOT NULL;

ALTER TABLE users
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS created_at;

ALTER TABLE companies RENAME CONSTRAINT companies_cnpj_key TO companies_tax_id_key;
ALTER TABLE companies RENAME COLUMN cnpj TO tax_id;

DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '20261107000200_standardize_columns_sales_numeric_and_status_enums';
  END IF;
END $$;

COMMIT;
```

---

## 4. Fluxo 3 — Cadastro e edição de empresa com `faixa_preco`

1. **Entrada (`POST /api/v1/empresas` e `PUT /api/v1/platform/companies/:companyId`):**
   - Campo opcional `faixa_preco?: '0-100' | '100-300' | '300-500' | '500-plus' | null` em `companyCreateSchema`.
2. **Validação:**
   - Se informado e não nulo, deve pertencer a `COMPANY_PRICE_RANGES`.
   - Se omitido ou `null` (ex.: empresas já existentes sendo editadas), é mantido/gravado como `NULL`.
3. **Persistência:**
   - Conversão de `faixa_preco` para literal `numrange` (`'[0,100]'`, `'[100,300]'`, `'[300,500]'`, `'[500,)'`) no `INSERT` e `UPDATE` de `companies` com cast `$n::numrange`.
   - Na coluna `cnpj`, todas as queries de `companyPostgresRepository` usam diretamente `cnpj` (substituindo `tax_id`).
   - Nas leituras/escritas de `status` no PostgreSQL, o adapter normaliza entre o enum `UPPER CASE` do banco (`'ATIVO'`, `'INATIVO'`, `'VERIFICADO'` / `'ACTIVE'`, `'PENDING'`, `'BLOCKED'`) e as interfaces da aplicação.

