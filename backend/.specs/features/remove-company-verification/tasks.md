# Remoção da Rota de Empresas Verificadas e Descontinuação de `is_verified`

## Objetivo
Remover a rota legada `GET /api/v1/empresas/verificadas/todas` e limpar todas as referências ao campo e método `is_verified` / `getVerified()` no backend e frontend, refletindo a migration `20261108000200_drop_company_is_verified` já aplicada no banco de dados.

## Restrições globais
- Não alterar as demais rotas públicas de empresas (`GET /api/v1/empresas`, `GET /api/v1/companies/search`, etc.).
- Manter o typecheck do backend e frontend compilando com código 0.
- Preservar compatibilidade da entidade `Company` com dados existentes.

## Pontos de atenção
- A query SQL no script de seed (`staging.seed.ts`) continha a coluna `is_verified` e causaria falha em bancos onde a migration foi executada; foi ajustada.
- Os testes de rotas (`company.routes.test.ts`), logs (`logging.services.test.ts`) e elegibilidade (`platform.eligibility.test.ts`) foram ajustados para não falhar após a remoção da rota.

---

## Task 1: Remover rota, controller, service e repositório de empresas verificadas no backend

**Arquivos:**
- Modificar:
  - `backend/src/routes/company.routes.ts`
  - `backend/src/controller/company.controller.ts`
  - `backend/src/services/company.service.ts`
  - `backend/src/repositories/company.repository.ts`
  - `backend/src/persistence/postgres/company.repository.ts`
  - `backend/src/persistence/json/company.repository.ts`
  - `backend/src/entities/company.entity.ts`
  - `backend/scripts/lib/staging.seed.ts`

**Passos:**
- [x] Remover a linha `router.get('/verificadas/todas', ...)` em `company.routes.ts`.
- [x] Remover o método `listVerifiedCompanies` em `company.controller.ts`.
- [x] Remover `getVerifiedCompanies` em `company.service.ts`.
- [x] Remover o contrato `getVerified` em `company.repository.ts` e suas implementações em `postgres/` e `json/`.
- [x] Remover a coluna `is_verified` do SQL de seed em `staging.seed.ts`.
- [x] Tornar `verificado?: boolean` opcional em `company.entity.ts`.

**Pronto quando:**
- `npm run typecheck` no backend compilar sem erros de tipos.

**Commit sugerido:**
`refactor(companies): drop verified companies route and remove is_verified references`

---

## Task 2: Remover consumidor no frontend e atualizar testes

**Arquivos:**
- Modificar:
  - `frontend/src/lib/api.ts`
  - `frontend/src/lib/api.test.ts`
  - `backend/tests/company.routes.test.ts`
  - `backend/tests/logging.services.test.ts`
  - `backend/tests/platform.eligibility.test.ts`

**Passos:**
- [x] Remover `fetchEmpresasVerificadas` de `frontend/src/lib/api.ts`.
- [x] Remover a asserção de teste correspondente em `frontend/src/lib/api.test.ts`.
- [x] Remover os casos de `/verificadas/todas` dos testes `company.routes.test.ts`, `logging.services.test.ts` e `platform.eligibility.test.ts`.

**Pronto quando:**
- Testes unitários do backend e frontend passarem com sucesso.

**Commit sugerido:**
`test(companies): remove verified companies route assertions and frontend client`

