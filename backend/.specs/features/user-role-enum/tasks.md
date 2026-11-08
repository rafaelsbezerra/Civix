# Padronização de `users.role` para ENUM em UPPER CASE (`user_role`)

## Objetivo
Converter a coluna `role` da tabela `users` no PostgreSQL para um tipo `ENUM` nativo (`user_role`) com valores em `UPPER CASE` (`ADMIN_EMPRESA`, `SUPER_ADMIN`, `CLIENTE`, `ATENDENTE`), atualizar o `schema.prisma`, os scripts de seed/reset e normalizar as leituras e escritas nos repositórios PostgreSQL sem alterar os contratos externos da API.

## Restrições globais
- Não executar migrations automaticamente contra ambientes de produção (`prisma migrate deploy` / `dev`).
- Preservar as migrations anteriores em `backend/prisma/migrations/` sem modificá-las.
- Toda migration deve conter `INSERT` idempotente em `_prisma_migrations` no `migration.sql` (UP) e script de reversão em `down.sql` (DOWN + `DELETE` em `_prisma_migrations`).
- Atualizar obrigatoriamente o script de seed e manter compatibilidade com o script de reset usando as variáveis do `.env` (`DATABASE_URL` / `STAGING_DATABASE_URL`).

## Pontos de atenção
- A tabela `users` possui duas constraints criadas em migrations anteriores (`users_role_check` e `users_company_scope_check`) que comparam `role` com strings em lowercase; ambas devem ser removidas antes do `ALTER COLUMN role TYPE user_role` e `users_company_scope_check` deve ser recriada comparando com os valores em `UPPER CASE` do enum.
- Os tokens JWT, middlewares e o frontend esperam `role` em lowercase (`super_admin`, `admin_empresa`, `atendente`, `cliente`), portanto `normalizeUser` e `normalizeAuthRow` devem sempre aplicar `.toLowerCase()` ao ler do PostgreSQL.

---

## Task 1: Criar a migration `20261108000100_add_user_role_enum`, atualizar o `schema.prisma` e o seed

**Arquivos:**
- Modificar:
  - `backend/prisma/schema.prisma`
  - `backend/scripts/lib/staging.seed.ts`
  - `backend/tests/prisma.tooling.test.mjs`
  - `backend/tests/staging.seed.test.ts`
- Criar:
  - `backend/prisma/migrations/20261108000100_add_user_role_enum/migration.sql`
  - `backend/prisma/migrations/20261108000100_add_user_role_enum/down.sql`

**Passos:**
- [x] Criar `backend/prisma/migrations/20261108000100_add_user_role_enum/migration.sql` com a criação do `TYPE user_role AS ENUM ('ADMIN_EMPRESA', 'SUPER_ADMIN', 'CLIENTE', 'ATENDENTE')`, substituição das constraints `users_role_check` e `users_company_scope_check`, conversão de `users.role` e `INSERT` em `_prisma_migrations`.
- [x] Criar `backend/prisma/migrations/20261108000100_add_user_role_enum/down.sql` revertendo `users.role` para `TEXT` em lowercase, recriando `users_role_check` e `users_company_scope_check`, removendo `user_role` e deletando o registro de `_prisma_migrations`.
- [x] Atualizar `backend/prisma/schema.prisma` adicionando `enum user_role` e alterando `users.role` para `user_role`.
- [x] Atualizar `backend/scripts/lib/staging.seed.ts` para gravar `user.role.toUpperCase()` no banco e ajustar os testes em `backend/tests/staging.seed.test.ts` e `backend/tests/prisma.tooling.test.mjs`.

**Pronto quando:**
- `npm --prefix backend run test:prisma` e `npm --prefix backend run test:seed` passarem sem erros.

**Commit sugerido:**
`feat(db): convert users.role to uppercase user_role enum`

---

## Task 2: Normalizar `role` nos repositórios PostgreSQL e atualizar testes unitários

**Arquivos:**
- Modificar:
  - `backend/src/persistence/postgres/user.repository.ts`
  - `backend/src/persistence/postgres/auth.repository.ts`
  - `backend/src/persistence/postgres/company.repository.ts`
  - `backend/src/persistence/postgres/plan.repository.ts`
  - `backend/src/persistence/postgres/sale.repository.ts`
  - `backend/tests/platform.users.postgres.test.ts`
  - `backend/tests/http.adoption.test.ts`

**Passos:**
- [x] Atualizar `normalizeUser` em `user.repository.ts` e `normalizeAuthRow` em `auth.repository.ts` para converter `role` para lowercase (`user.role.toLowerCase() as UserRole`) ao ler registros do PostgreSQL.
- [x] Atualizar todas as queries SQL de `user.repository.ts` e `auth.repository.ts` (`SELECT`, `INSERT`, `UPDATE`) para enviar e comparar `role` em `UPPER CASE` (`'SUPER_ADMIN'`, `'ADMIN_EMPRESA'`, `'ATENDENTE'`, `role.toUpperCase()`).
- [x] Atualizar as verificações transacionais de `actor.role` em `company.repository.ts`, `plan.repository.ts` e `sale.repository.ts` para `actor.role.toLowerCase() !== 'super_admin'`.
- [x] Atualizar as asserções SQL em `backend/tests/platform.users.postgres.test.ts` e `backend/tests/http.adoption.test.ts`.

**Pronto quando:**
- Os testes de persistência PostgreSQL (`platform.users.postgres.test.ts`, `platform.sales.postgres.test.ts`, `platform.postgres.test.ts`), `npm --prefix backend run typecheck:foundation`, `npm --prefix backend run lint` e `npm --prefix backend run format:check` passarem sem erros.

**Commit sugerido:**
`feat(users): normalize user_role enum in postgres repositories`

