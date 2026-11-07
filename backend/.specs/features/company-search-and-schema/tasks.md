# Busca pública de empresas, migrations de padronização e cadastro com faixa de preço

## Objetivo
Implementar no backend a rota `GET /api/v1/companies/search` com filtro por nome e/ou UF + faixa de preço (`numrange`), criar as duas migrations versionadas (adição de `price_range NUMRANGE` e padronização de `cnpj`, `created_at`/`updated_at`, `sales` `NUMERIC(10, 2)` e enums de `status` em UPPER CASE) e habilitar `faixa_preco` no cadastro/edição de empresas sem impactar registros existentes.

## Restrições globais
- Não executar migrations automaticamente nem em produção (`prisma migrate deploy` / `dev` não devem ser rodados contra ambientes reais).
- Preservar as migrations anteriores já existentes em `backend/prisma/migrations/` sem alterá-las.
- Empresas já existentes sem `price_range` (`NULL`) não devem quebrar listagens, detalhes ou edições.
- Manter compatibilidade com a rota legada `/api/v1/empresas` enquanto expõe `/api/v1/companies/search`.

## Pontos de atenção
- Os enums no PostgreSQL (`user_status` e `company_status`) utilizam valores em `UPPER CASE` (`ACTIVE`, `PENDING`, `BLOCKED` e `ATIVO`, `INATIVO`, `VERIFICADO`), enquanto os contratos HTTP/TypeScript existentes usam lowercase; os adapters PostgreSQL devem converter de forma transparente nas leituras/escritas.
- Na tabela `plans`, `is_active` é mantido inalterado conforme decisão CS-D04.

---

## Task 1: Criar as duas migrations SQL e atualizar o `schema.prisma`

**Arquivos:**
- Modificar:
  - `backend/prisma/schema.prisma`
  - `backend/scripts/seed.staging.ts`
  - `backend/scripts/lib/staging.seed.ts`
  - `backend/tests/staging.seed.test.ts`
- Criar:
  - `backend/prisma/migrations/20261107000100_add_company_price_range/migration.sql`
  - `backend/prisma/migrations/20261107000100_add_company_price_range/down.sql`
  - `backend/prisma/migrations/20261107000200_standardize_columns_sales_numeric_and_status_enums/migration.sql`
  - `backend/prisma/migrations/20261107000200_standardize_columns_sales_numeric_and_status_enums/down.sql`
  - `backend/scripts/reset.database.ts`
  - `backend/scripts/lib/database.reset.ts`

**Passos:**
- [x] Criar a migration `20261107000100_add_company_price_range/migration.sql` (UP + `INSERT` em `_prisma_migrations`) e `down.sql` (DOWN + `DELETE` em `_prisma_migrations`) adicionando `price_range NUMRANGE`, constraint `companies_price_range_non_empty_check` e índice GiST `companies_price_range_gist_idx`.
- [x] Criar a migration `20261107000200_standardize_columns_sales_numeric_and_status_enums/migration.sql` (UP + `INSERT` em `_prisma_migrations`) e `down.sql` (DOWN + `DELETE` em `_prisma_migrations`) renomeando `tax_id` para `cnpj`, adicionando/padronizando `created_at` e `updated_at` em `users` e `companies`, alterando `sales.amount` e `sales.plan_price` para `NUMERIC(10, 2)` e criando/aplicando os enums `user_status` e `company_status` em UPPER CASE.
- [x] Atualizar `backend/prisma/schema.prisma` com os enums `user_status` e `company_status`, o campo `cnpj`, `price_range`, `createdAt`/`updatedAt` (`@map("created_at")` / `@map("updated_at")`) e `Decimal(10, 2)` em `sales`.
- [x] Atualizar o script de seed (`backend/scripts/lib/staging.seed.ts` e `backend/scripts/seed.staging.ts`) e o script de reset (`backend/scripts/lib/database.reset.ts` e `backend/scripts/reset.database.ts`) para refletir as migrations e operar com as variáveis do `.env` (`DATABASE_URL` / `STAGING_DATABASE_URL`).

**Pronto quando:**
- Os dois arquivos `migration.sql` e o `schema.prisma` estiverem criados e validados por `npm run test:prisma`.

**Commit sugerido:**
`feat(db): add company price range and schema standardization migrations`

---

## Task 2: Atualizar entidades, DTOs e persistência para `cnpj`, `faixa_preco`, timestamps e enums

**Arquivos:**
- Modificar:
  - `backend/src/entities/company.entity.ts`
  - `backend/src/entities/user.entity.ts`
  - `backend/src/dtos/company.create.dto.ts`
  - `backend/src/repositories/company.repository.ts`
  - `backend/src/persistence/postgres/company.repository.ts`
  - `backend/src/persistence/postgres/user.repository.ts`
  - `backend/src/persistence/postgres/auth.repository.ts`
  - `backend/src/persistence/postgres/plan.repository.ts`
  - `backend/src/persistence/postgres/sale.repository.ts`
  - `backend/src/persistence/json/company.repository.ts`

**Passos:**
- [x] Adicionar as constantes `BRAZIL_UFS`, `COMPANY_PRICE_RANGES` e o campo opcional `faixa_preco` em `company.entity.ts` e `company.create.dto.ts`, além de `createdAt`/`updatedAt` em `Company` e `User`.
- [x] Adicionar o método `searchPublicCompanies(filters)` em `CompanyRepository` e implementá-lo nos adapters PostgreSQL (`price_range && $range::numrange`) e JSON.
- [x] Atualizar `companyPostgresRepository` para usar a coluna `cnpj` (no lugar de `tax_id`), persistir/ler `price_range` no cadastro e edição de empresas, atualizar `updated_at` e converter `status` em UPPER CASE para o banco.
- [x] Alinhar as comparações e gravações de `status` em `user.repository.ts`, `auth.repository.ts`, `plan.repository.ts` e `sale.repository.ts` com os enums em UPPER CASE.

**Pronto quando:**
- O typecheck (`npm run typecheck:foundation`) e os testes de persistência/plataforma passarem sem erros.

**Commit sugerido:**
`feat(companies): support price range persistence and standardized schema columns`

---

## Task 3: Expor a rota `GET /api/v1/companies/search` e validar filtros de busca

**Arquivos:**
- Modificar:
  - `backend/src/app.ts`
  - `backend/src/routes/company.routes.ts`
  - `backend/src/controller/company.controller.ts`
  - `backend/src/services/company.service.ts`
  - `backend/tests/company.routes.test.ts`
  - `backend/tests/platform.postgres.test.ts`

**Passos:**
- [x] Montar `/api/v1/companies` em `backend/src/app.ts` (preservando `/api/v1/empresas`) e adicionar `router.get('/search', companyController.searchCompanies)` em `company.routes.ts`.
- [x] Atualizar `companyController.searchCompanies` e `companyService` para validar e executar os modos de busca (`q` apenas, `uf` + `priceRange`, ou os 3 combinados).
- [x] Adicionar testes cobrindo busca por nome, busca por UF + faixa de preço, combinação dos 3 filtros, rejeição `400` para parâmetros incompletos/inválidos e cadastro de empresa com `faixa_preco`.

**Pronto quando:**
- `npm run test:foundation`, `npm run test:platform`, `npm run test:prisma`, `npm run lint` e `npm run format:check` passarem integralmente.

**Commit sugerido:**
`feat(companies): add /companies/search endpoint with name, UF and price range filters`
