# Feature — Remoção da Rota de Empresas Verificadas e Descontinuação do Campo `is_verified`

Data: 2026-11-12  
Status: Implementado  
Arquivos da spec: [Feature](feature.md) · [SDD](sdd.md) · [Tasks](tasks.md)  

## 1. Visão geral

Com a aplicação da migration `20261108000200_drop_company_is_verified`, a coluna `is_verified` foi removida da tabela `companies` no PostgreSQL, consolidando a regra de negócio de que **toda empresa cadastrada na plataforma é considerada verificada por padrão**.

Esta especificação formalizou e concluiu a eliminação do endpoint legado `GET /api/v1/empresas/verificadas/todas`, a descontinuação do método `getVerified()` nos repositórios/services do backend e a remoção da função consumidora `fetchEmpresasVerificadas()` no frontend.

## 2. Escopo funcional e técnico

1. **Eliminação do Endpoint Legado:**
   - Remoção da rota `GET /api/v1/empresas/verificadas/todas` em [`backend/src/routes/company.routes.ts`](../../../src/routes/company.routes.ts).
   - Remoção do controller `listVerifiedCompanies` em [`backend/src/controller/company.controller.ts`](../../../src/controller/company.controller.ts).
   - Remoção do service `getVerifiedCompanies()` em [`backend/src/services/company.service.ts`](../../../src/services/company.service.ts).

2. **Ajuste na Camada de Persistência:**
   - Remoção do método `getVerified()` da interface `CompanyRepository` em [`backend/src/repositories/company.repository.ts`](../../../src/repositories/company.repository.ts).
   - Remoção da implementação `getVerified()` em [`backend/src/persistence/postgres/company.repository.ts`](../../../src/persistence/postgres/company.repository.ts) e [`backend/src/persistence/json/company.repository.ts`](../../../src/persistence/json/company.repository.ts).
   - Remoção da coluna `is_verified` do script de seed [`backend/scripts/lib/staging.seed.ts`](../../../scripts/lib/staging.seed.ts).
   - Flexibilização do campo `verificado` para opcional (`verificado?: boolean`) na entidade [`backend/src/entities/company.entity.ts`](../../../src/entities/company.entity.ts) para evitar quebras em schemas existentes.

3. **Ajuste nos Consumidores do Frontend:**
   - Remoção de `fetchEmpresasVerificadas()` em [`frontend/src/lib/api.ts`](../../../../frontend/src/lib/api.ts).
   - Atualização do teste de integração [`frontend/src/lib/api.test.ts`](../../../../frontend/src/lib/api.test.ts).

4. **Ajuste da Suíte de Testes:**
   - Atualização de [`backend/tests/company.routes.test.ts`](../../../tests/company.routes.test.ts), [`backend/tests/logging.services.test.ts`](../../../tests/logging.services.test.ts) e [`backend/tests/platform.eligibility.test.ts`](../../../tests/platform.eligibility.test.ts) para remover a rota `/verificadas/todas`.

## 3. Decisões confirmadas

| ID | Decisão |
| --- | --- |
| **VERIF-D01** | A rota `GET /api/v1/empresas/verificadas/todas` é completamente descontinuada e removida. Consultas públicas de empresas continuam através de `GET /api/v1/empresas` e `GET /api/v1/companies/search`. |
| **VERIF-D02** | O campo `is_verified` foi removido fisicamente do banco de dados na migration `20261108000200_drop_company_is_verified`. |
| **VERIF-D03** | No frontend, `fetchEmpresasVerificadas` foi removida, mantendo as listagens via `fetchEmpresas()` e `fetchEmpresasByCategoria()`. |

## 4. Critérios de aceite

- **CA-01:** A rota `GET /api/v1/empresas/verificadas/todas` não responde mais e foi removida do roteador.
- **CA-02:** O script de seed (`staging.seed.ts`) executa sem referenciar `is_verified`.
- **CA-03:** Todos os testes de rotas de catálogo (`npm run test:foundation` e `company.routes.test.ts`) passam com sucesso.
- **CA-04:** O frontend compila sem referências a `fetchEmpresasVerificadas`.
