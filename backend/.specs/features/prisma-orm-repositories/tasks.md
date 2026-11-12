# Adoção do Prisma ORM e Entrada Única de Persistência

## Objetivo
Substituir as consultas SQL manuais executadas via `@neondatabase/serverless` e `pg` pelo `PrismaClient`. Manter os contratos em `backend/src/repositories/` e selecionar os adaptadores com `USE_MOCK_DATA` em `backend/src/persistence/index.ts`.

## Restrições globais
- Não quebrar a API pública nem os contratos consumidos pelos controllers e services.
- Os adaptadores JSON e PostgreSQL importam como tipos os contratos de `backend/src/repositories/`. Os services usam `backend/src/persistence/index.ts`.
- Preservar o funcionamento do modo local (`USE_MOCK_DATA=true`) para testes offline.
- Não executar migrations automaticamente nem em produção (`prisma migrate deploy` não deve ser disparado automaticamente).
- Manter as mensagens de erro em português brasileiro e identificadores/código em inglês.
- Não fazer commit antes de revisão
- Não criar woerktree
- Não criar branch
- Fazer alterações apenas na staging

## Pontos de atenção
- O tipo `numrange` da coluna `price_range` em `companies` requer tratamento especial de conversão via `$executeRaw` / `$queryRaw` para preservar as faixas pré-definidas (`0-100`, `100-300`, `300-500`, `500-plus`).
- As transações com lock consultivo de concorrência (`pg_advisory_xact_lock`) devem ser mantidas dentro do `prisma.$transaction`.
- Os enums do PostgreSQL (`user_status`, `company_status`, `user_role`) utilizam valores em caixa alta (`ACTIVE`, `ATIVO`, `SUPER_ADMIN`), exigindo normalização consistente com os DTOs em minúsculo da aplicação.

---

## Task 1: Configurar singleton do `PrismaClient` e alinhar adaptadores de Autenticação e Usuários

**Arquivos:**
- Criar:
  - `backend/src/shared/config/prisma.ts`
- Modificar:
  - `backend/src/persistence/postgres/auth.repository.ts`
  - `backend/src/persistence/postgres/user.repository.ts`
  - `backend/src/persistence/json/auth.repository.ts`
  - `backend/src/persistence/json/user.repository.ts`

**Passos:**
- [x] Criar `backend/src/shared/config/prisma.ts` instanciando o `PrismaClient` com pooling do PostgreSQL (`@prisma/adapter-pg` ou URL nativa).
- [x] Conferir os imports de tipo dos adaptadores JSON e PostgreSQL correspondentes em `src/repositories/`.

**Pronto quando:**
- `shared/config/prisma.ts` estiver criado e os arquivos de `auth` e `user` compilarem com os contratos de `src/repositories/`.

**Commit sugerido:**
`feat(db): setup prisma client singleton and align auth and user adapters`

---

## Task 2: Implementar persistência com Prisma ORM em Autenticação e Usuários

**Arquivos:**
- Modificar:
  - `backend/src/persistence/postgres/auth.repository.ts`
  - `backend/src/persistence/postgres/user.repository.ts`

**Passos:**
- [ ] Reescrever `authPostgresRepository` utilizando `prisma.users` (`findFirst`, `update`, `transaction`) para busca de convites, ativação e redefinição de senhas, substituindo strings SQL por métodos do Prisma.
- [ ] Reescrever `userPostgresRepository` utilizando `prisma.users` para listagem de administração, contagens de métricas, atualização de perfil e controle de status.
- [x] Manter `pg_advisory_xact_lock` dentro de `prisma.$transaction` nas operações concorrentes de alteração de papéis/ativação.

As operações foram migradas em grande parte. Permanecem SQL parametrizado para preservar atomicidade e o relógio do banco; a validação em PostgreSQL real está pendente.

**Pronto quando:**
- Testes de autenticação e usuários (`npm run test:users`) passarem com código 0 utilizando a implementação Prisma.

**Commit sugerido:**
`feat(db): implement prisma orm for auth and user postgres repositories`

---

## Task 3: Implementar persistência com Prisma em Empresas e Storage

**Arquivos:**
- Modificar:
  - `backend/src/persistence/postgres/company.repository.ts`
  - `backend/src/persistence/postgres/storage.repository.ts`
  - `backend/src/persistence/json/company.repository.ts`
  - `backend/src/persistence/json/storage.repository.ts`

**Passos:**
- [x] Conferir os imports de tipo dos adaptadores JSON e PostgreSQL correspondentes em `src/repositories/`.
- [x] Reescrever `companyPostgresRepository` utilizando `prisma.companies` (`findMany`, `count`, `create`, `update`, `$transaction`), adaptando a gravação de `price_range` via `$executeRaw` com `numrange`.
- [x] Reescrever `storagePostgresRepository` utilizando `prisma.images` para salvar metadados de upload, consultar chaves de objetos e excluir referências.

**Pronto quando:**
- Testes de empresas e storage (`npm run test:storage`) passarem sem regressões.

**Commit sugerido:**
`feat(db): implement prisma orm for company and storage postgres repositories`

---

## Task 4: Implementar persistência com Prisma em Planos e Vendas

**Arquivos:**
- Modificar:
  - `backend/src/persistence/postgres/plan.repository.ts`
  - `backend/src/persistence/postgres/sale.repository.ts`
  - `backend/src/persistence/json/plan.repository.ts`
  - `backend/src/persistence/json/sale.repository.ts`

**Passos:**
- [x] Conferir os imports de tipo dos adaptadores JSON e PostgreSQL correspondentes em `src/repositories/`.
- [x] Reescrever `planPostgresRepository` utilizando `prisma.plans` (`findMany`, `findFirst`, `create`, `update`), mantendo `pg_advisory_xact_lock` em transações de escrita.
- [x] Reescrever `salePostgresRepository` utilizando `prisma.sales` (`findMany`, `create`, `delete`) e validações de integridade com planos e empresas.

**Pronto quando:**
- As operações de planos e vendas executarem integralmente via Prisma Client.

**Commit sugerido:**
`feat(db): implement prisma orm for plan and sale postgres repositories`

---

## Task 5 — Centralizar a seleção de persistência, limpar conexões obsoletas e validar

- [x] Criar `backend/src/persistence/index.ts` e exportar os seis repositórios selecionados por `USE_MOCK_DATA`.
- [x] Atualizar os imports dos services e remover os seis seletores por domínio da raiz de `backend/src/persistence/`.
- [x] Conferir os contratos em `src/repositories/` e seus imports de tipo nos adaptadores JSON e PostgreSQL.
- [x] Revisar `backend/src/shared/config/data.ts` para descontinuar o pool SQL direto se estiver sem consumidores.
- [x] Executar `npm run typecheck` ou `tsc --noEmit`.
- [x] Executar `npm run lint` e `npm run format:check`.
- [ ] Executar `npm run test:foundation` e verificar o funcionamento com `USE_MOCK_DATA=true`.

A suíte `test:foundation` foi executada, mas não passou: seis cenários de logo falharam e um foi cancelado. Os 12 testes de persistência local passaram. O build, o lint e a verificação de formatação passaram; o lint registrou avisos nos arquivos gerados pelo Prisma. Falta validar as operações em PostgreSQL real.

**Pronto quando**

Os services consumirem os repositórios pelo módulo central, os seis seletores por domínio tiverem sido removidos e todas as verificações passarem.

**Commit sugerido**

`refactor(db): centralize repository selection and validate prisma migration`
