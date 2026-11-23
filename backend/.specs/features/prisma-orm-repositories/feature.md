# Feature — Adoção do Prisma ORM e Entrada Única de Persistência

Data: 2026-11-11
Status: Em implementação
Arquivos da spec: [Feature](feature.md) · [SDD](sdd.md) · [Tasks](tasks.md)

## 1. Visão geral

Esta especificação define a transição do backend da Civix da execução de queries SQL puras (gerenciadas via driver `@neondatabase/serverless` / `pg`) para a adoção plena do **Prisma Client como ORM oficial** nas operações de banco de dados PostgreSQL.

Os contratos TypeScript permanecem em `backend/src/repositories/`. Os services acessam os repositórios por `backend/src/persistence/index.ts`.

## 2. Escopo funcional e técnico

1. **Contratos e entrada única de persistência**
   - Manter os seis contratos TypeScript em seus arquivos de domínio em `backend/src/repositories/`.
   - Importar os contratos como tipos nos adaptadores JSON e PostgreSQL.
   - Exportar os seis repositórios selecionados por `USE_MOCK_DATA` em `backend/src/persistence/index.ts`, atualizar os imports dos services e remover os seis seletores por domínio.

2. **Instanciação e Configuração Centralizada do `PrismaClient`:**
   - Criar `backend/src/shared/config/prisma.ts` exportando a instância única (singleton) do `PrismaClient`, conectando à `DATABASE_URL` via `@prisma/adapter-pg` ou connection pool direto compatível com o Neon/PostgreSQL.

3. **Reescrita dos Repositórios PostgreSQL com Prisma ORM:**
   - **`auth.repository.ts`:**
     - Consultas de usuários para convite e login (`prisma.users.findFirst` com `mode: 'insensitive'`).
     - Ativação de usuário e atualização de senha dentro de transação `prisma.$transaction`.
   - **`company.repository.ts`:**
     - Listagem de empresas com paginação, filtros e ordenação usando `prisma.companies.findMany` e contagem com `prisma.companies.count`.
     - Criação de empresa com venda inicial atômica via `prisma.$transaction`.
     - Atualização atômica de chaves de imagem (`cover_key`, `logo_key`).
     - Compatibilidade com a coluna especial `price_range` (`numrange`).
   - **`plan.repository.ts`:**
     - CRUD de planos administrativos usando `prisma.plans` (`findMany`, `findUnique`, `create`, `update`).
   - **`sale.repository.ts`:**
     - Listagem de vendas com filtros (`prisma.sales.findMany` / `count`), criação manual de vendas e exclusão.
   - **`storage.repository.ts`:**
     - Registro, consulta e exclusão de metadados de imagens usando `prisma.images`.
   - **`user.repository.ts`:**
     - Listagem de administração de usuários (`prisma.users.findMany`), métricas de usuários (`count` agrupado), atualização de perfil e tokens de redefinição de senha.

4. **Preservação de Proteções Específicas do PostgreSQL:**
   - Locks consultivos de concorrência (`pg_advisory_xact_lock`): executados dentro das transações do Prisma através de `tx.$executeRaw` para garantir concorrência segura em operações administrativas críticas.
   - Modo de teste e desenvolvimento local (`USE_MOCK_DATA=true`): mantido 100% funcional sem exigir banco de dados real.

## 3. Decisões confirmadas

| ID | Decisão |
| --- | --- |
| **PRISMA-D01** | Os contratos TypeScript permanecem nos arquivos de domínio em `backend/src/repositories/`. |
| **PRISMA-D02** | Os adaptadores JSON e PostgreSQL importam como tipos os contratos de `backend/src/repositories/`. |
| **PRISMA-D03** | Os services importam de `backend/src/persistence/index.ts`. O módulo seleciona os adaptadores com `USE_MOCK_DATA` e substitui os seis seletores por domínio. |
| **PRISMA-D04** | O driver direto `db.query` em `backend/src/persistence/postgres/` é substituído pelos métodos do `PrismaClient` (`findMany`, `findUnique`, `create`, `update`, `delete`, `$transaction`). |
| **PRISMA-D05** | Locks de transação (`pg_advisory_xact_lock`) e intervalos `numrange` (`price_range`) utilizam `$executeRaw` / `$queryRaw` do Prisma mantendo comportamento idêntico ao atual. |

Na implementação atual, também permanecem operações SQL parametrizadas pelo Prisma para locks de linha e para preservar o relógio do banco e a revogação monotônica de tokens, incluindo a atualização atômica do próprio perfil. Essas operações ainda precisam de validação em PostgreSQL real.

## 4. Critérios de aceite

- **CA-01:** Os seis contratos permanecem em `backend/src/repositories/`, os adaptadores os importam como tipos e os services usam `backend/src/persistence/index.ts`. Os seis seletores por domínio foram removidos.
- **CA-02:** O backend compila sem erros com `npm run typecheck` (`tsc --noEmit`).
- **CA-03:** Todas as 6 áreas de persistência relacional (`auth`, `company`, `plan`, `sale`, `storage`, `user`) em `backend/src/persistence/postgres/` utilizam `PrismaClient` para suas operações.
- **CA-04:** Operações com lock de transação (`changeCompanyAdministration`, `changeUserAdministration`, `activateUser`, `writePlan`) utilizam `prisma.$transaction` com o lock consultivo ativo.
- **CA-05:** O modo local (`USE_MOCK_DATA=true`) continua funcionando sem erros.
- **CA-06:** Toda a suíte de testes de foundation do backend (`npm run test:foundation`) passa com 100% de sucesso.
- **CA-07:** Linter (`npm run lint`) e formatação (`npm run format:check`) executam sem divergências.
