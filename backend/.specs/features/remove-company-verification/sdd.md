# SDD — Remoção da Rota de Empresas Verificadas e Descontinuação de `is_verified`

## 1. Contexto e Motivação Técnica

No início do projeto, existia um conceito de verificação manual de empresas refletido na coluna `companies.is_verified BOOLEAN` e no endpoint público `GET /api/v1/empresas/verificadas/todas`.

Com a consolidação da regra de que **toda empresa cadastrada já nasce verificada no onboarding**, a migration `20261108000200_drop_company_is_verified` removeu a coluna do banco de dados PostgreSQL. Para evitar erros de execução em runtime (`column "is_verified" does not exist`) e eliminar código morto, os pontos que consumiam esse campo foram alinhados.

---

## 2. Diagrama de Camadas Afetadas

```text
[Frontend: api.ts]
   │
   x (Removido: fetchEmpresasVerificadas())
   │
   ▼
[Backend Router: company.routes.ts]
   │
   x (Removido: GET /verificadas/todas)
   │
   ▼
[Controller: company.controller.ts]
   │
   x (Removido: listVerifiedCompanies)
   │
   ▼
[Service: company.service.ts]
   │
   x (Removido: getVerifiedCompanies)
   │
   ▼
[Repository: company.repository.ts (Postgres & JSON)]
   │
   x (Removido: getVerified())
   │
   ▼
[PostgreSQL Database]
   (Migration 20261108000200_drop_company_is_verified já aplicada)
```

---

## 3. Alterações por Módulo

### 3.1. Rota e Controller
- Em `backend/src/routes/company.routes.ts`:
  ```typescript
  // Removido:
  // router.get('/verificadas/todas', companyController.listVerifiedCompanies);
  ```
- Em `backend/src/controller/company.controller.ts`:
  Função `listVerifiedCompanies` excluída.

### 3.2. Serviço e Repositório
- Em `backend/src/services/company.service.ts`:
  Função `getVerifiedCompanies` excluída.
- Em `backend/src/repositories/company.repository.ts`:
  Removido método `getVerified(): Promise<Company[]>`.
- Em `backend/src/persistence/postgres/company.repository.ts` e `backend/src/persistence/json/company.repository.ts`:
  Implementações de `getVerified` excluídas.

### 3.3. Script de Seed
- Em `backend/scripts/lib/staging.seed.ts`:
  A query SQL `INSERT INTO companies (...)` foi ajustada para remover o campo `is_verified` e seu bind correspondente.

### 3.4. Frontend
- Em `frontend/src/lib/api.ts`:
  Função `fetchEmpresasVerificadas` removida.
- Em `frontend/src/lib/api.test.ts`:
  Removida asserção da chamada para `/api/v1/empresas/verificadas/todas`.

