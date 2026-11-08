# Feature — Padronização de `users.role` para ENUM em UPPER CASE (`user_role`)

Data: 2026-11-08  
Status: Especificado  
Arquivos da spec: [Feature](feature.md) · [SDD](sdd.md) · [Tasks](tasks.md)

## 1. Visão geral

Converter a coluna `role` da tabela `users` no PostgreSQL (atualmente `TEXT` com valores em minúsculas e constraints `CHECK` manuais) para um tipo nativo `ENUM` chamado `user_role` com valores em **`UPPER CASE`** (`'ADMIN_EMPRESA'`, `'SUPER_ADMIN'`, `'CLIENTE'`, `'ATENDENTE'`), mantendo total compatibilidade com os contratos HTTP, tokens JWT e camadas de serviço/frontend por meio de normalização nos repositórios PostgreSQL (`.toUpperCase()` na escrita/filtro SQL e `.toLowerCase()` na leitura).

## 2. Escopo funcional

1. **Migration de Banco de Dados (`20261108000100_add_user_role_enum`):**
   - Criar o tipo `user_role AS ENUM ('ADMIN_EMPRESA', 'SUPER_ADMIN', 'CLIENTE', 'ATENDENTE')`.
   - Remover as constraints antigas baseadas em `TEXT` minúsculo (`users_role_check` e `users_company_scope_check`).
   - Converter a coluna `users.role` para `user_role` preservando todos os dados existentes (`UPPER(TRIM(role::text))::user_role`).
   - Recriar a constraint `users_company_scope_check` validando o escopo empresarial com os valores em `UPPER CASE` (`'ADMIN_EMPRESA'`, `'ATENDENTE'` com `company_id IS NOT NULL`; `'SUPER_ADMIN'`, `'CLIENTE'` com `company_id IS NULL`).
   - Incluir registro idempotente em `_prisma_migrations` no `migration.sql` (UP) e script completo de reversão em `down.sql` (DOWN + remoção de `_prisma_migrations`).
2. **Schema Prisma (`backend/prisma/schema.prisma`):**
   - Declarar o `enum user_role` com `ADMIN_EMPRESA`, `SUPER_ADMIN`, `CLIENTE` e `ATENDENTE`.
   - Atualizar `users.role` de `String` para `user_role`.
3. **Scripts de Seed e Reset (`staging.seed.ts` e `database.reset.ts`):**
   - Atualizar o script de seed para gravar `users.role` em `UPPER CASE` (`user.role.toUpperCase()`) no PostgreSQL.
   - Garantir que o script de reset continue validando e limpando as tabelas sem afetar os tipos `ENUM` e `_prisma_migrations`.
4. **Repositórios PostgreSQL e Normalização (`backend/src/persistence/postgres/`):**
   - Normalizar `user.role` para lowercase (`user.role.toLowerCase()`) na leitura de registros em `user.repository.ts` e `auth.repository.ts`.
   - Converter parâmetros e literais SQL de `role` para `UPPER CASE` (`'SUPER_ADMIN'`, `'ADMIN_EMPRESA'`, `'ATENDENTE'`, `'CLIENTE'`) nas queries de `user.repository.ts`, `auth.repository.ts`, `company.repository.ts`, `plan.repository.ts` e `sale.repository.ts`.

## 3. Decisões confirmadas

| ID | Decisão |
| --- | --- |
| **UR-D01** | O tipo no banco de dados será `user_role AS ENUM ('ADMIN_EMPRESA', 'SUPER_ADMIN', 'CLIENTE', 'ATENDENTE')` em `UPPER CASE`, alinhado ao padrão já adotado em `user_status` e `company_status`. |
| **UR-D02** | Os contratos externos (HTTP, payloads JWT e tipos TypeScript `UserRole` no domínio/frontend) permanecem em lowercase (`'admin_empresa'`, `'super_admin'`, `'cliente'`, `'atendente'`), com conversão transparente na camada `persistence/postgres` e no script de seed. |
| **UR-D03** | A migration inclui `INSERT` idempotente em `_prisma_migrations` (UP), arquivo `down.sql` (DOWN) e atualização dos scripts de seed e reset conforme regras globais de `.specs/README.md`. |

## 4. Critérios de aceite

- **CA-01:** A migration `20261108000100_add_user_role_enum` converte `users.role` para `user_role` em `UPPER CASE` sem perda de dados e recria `users_company_scope_check` compatível com o enum.
- **CA-02:** O `down.sql` reverte `users.role` para `TEXT` em lowercase, restaura `users_role_check` e `users_company_scope_check`, remove o tipo `user_role` e limpa o registro em `_prisma_migrations`.
- **CA-03:** `backend/prisma/schema.prisma` contém `enum user_role` e passa na validação de `npm run test:prisma`.
- **CA-04:** Os repositórios PostgreSQL gravam e filtram `role` em `UPPER CASE` no SQL e retornam `role` normalizado em lowercase para a camada de serviço.
- **CA-05:** O script de seed (`staging.seed.ts`) insere `role` em `UPPER CASE` e passa em `npm run test:seed`.

