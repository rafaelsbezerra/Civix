# Feature — Busca pública de empresas e evolução de schema

Data: 2026-11-07  
Status: Decisões confirmadas (CS-D01 a CS-D05)  
Arquivos da spec: [Feature](feature.md) · [SDD](sdd.md) · [Tasks](tasks.md)  
Par frontend: [`frontend/.specs/features/company-search-and-schema/feature.md`](../../../../frontend/.specs/features/company-search-and-schema/feature.md)

## 1. Visão geral

Habilitar a busca pública de empresas por parâmetros de URL (`GET /api/v1/companies/search`) para atender aos dois cards de pesquisa do frontend (Home e Catálogo), evoluir o banco de dados PostgreSQL por meio de duas migrations versionadas e atualizar o cadastro de empresas para suportar a faixa de preço (`numrange`) sem impactar as empresas já existentes.

## 2. Escopo funcional

1. **Rota de consulta pública (`GET /api/v1/companies/search`):**
   - Modo 1: Busca apenas pelo nome da empresa (`?q=...`).
   - Modo 2: Busca combinada por UF + Faixa de preço (`?uf=...&priceRange=...`).
   - Modo 3: Busca combinada pelos 3 filtros (`?q=...&uf=...&priceRange=...`), quando os 3 forem informados.
   - Somente empresas elegíveis ao catálogo público (não inativas e não arquivadas) são retornadas.
2. **Migrations de banco de dados (PostgreSQL / Prisma 7):**
   - **Migration 1 (`20261107000100_add_company_price_range`):** adição da coluna `price_range NUMRANGE` (opcional/`NULL` para empresas existentes) na tabela `companies`, com constraint contra intervalo vazio e índice GiST.
   - **Migration 2 (`20261107000200_standardize_columns_sales_numeric_and_status_enums`):**
     - Renomear `companies.tax_id` para `companies.cnpj` preservando dados e constraint de unicidade.
     - Garantir `created_at` e `updated_at` (`TIMESTAMPTZ NOT NULL DEFAULT NOW()`) em `users` e `companies`, mapeados para `createdAt` e `updatedAt` em TypeScript/Prisma.
     - Alterar `sales.amount` e `sales.plan_price` para `NUMERIC(10, 2)`.
     - Converter `users.status` e `companies.status` para tipos `ENUM` em UPPER CASE (`user_status`: `'ACTIVE'`, `'PENDING'`, `'BLOCKED'`; `company_status`: `'ATIVO'`, `'INATIVO'`, `'VERIFICADO'`), mantendo `plans.is_active` sem alterações.
3. **Cadastro de empresa com faixa de preço (`numrange`):**
   - Permitir enviar a faixa de preço pré-definida (`0-100`, `100-300`, `300-500`, `500-plus`) no cadastro de novas empresas e gravá-la como `NUMRANGE` no banco.
   - Empresas já existentes continuam válidas com `price_range = NULL`.

## 3. Decisões confirmadas

| ID | Decisão |
| --- | --- |
| **CS-D01** | Rota em padrão inglês `/api/v1/companies/search` (mantendo `/api/v1/empresas` para compatibilidade legada). Aceita `?q=...`, `?uf=...&priceRange=...` ou os 3 juntos. |
| **CS-D02** | No cadastro (`CompanyForm`), o superadmin seleciona uma das faixas pré-definidas (`0-100`, `100-300`, `300-500`, `500-plus`), salva como `numrange` no banco. Empresas já existentes não são afetadas (`NULL`). |
| **CS-D03** | Colunas `created_at` e `updated_at` em `snake_case` no PostgreSQL em `users` e `companies`, mapeadas para `createdAt` / `updatedAt` no TypeScript/Prisma. |
| **CS-D04** | `plans.is_active` permanece inalterado. `users.status` e `companies.status` viram `ENUM` com valores em UPPER CASE (`ACTIVE`, `PENDING`, `BLOCKED` e `ATIVO`, `INATIVO`, `VERIFICADO`). |
| **CS-D05** | `sales.amount` e `sales.plan_price` passam para `NUMERIC(10, 2)`. |

## 4. Critérios de aceite

- **CA-01:** `GET /api/v1/companies/search?q=termo` retorna empresas ativas cujo nome contenha o termo (case-insensitive).
- **CA-02:** `GET /api/v1/companies/search?uf=SE&priceRange=100-300` retorna empresas ativas da UF informada cuja faixa `price_range` intersecte `[100,300]`.
- **CA-03:** Enviar apenas `uf` sem `priceRange` (ou `priceRange` sem `uf`) sem `q`, ou enviar UF/faixa inválida, retorna `400 VALIDATION_ERROR`.
- **CA-04:** As duas migrations SQL existem em `backend/prisma/migrations/` e o `backend/prisma/schema.prisma` reflete `cnpj`, `price_range`, `createdAt`/`updatedAt`, `Decimal(10, 2)` em `sales` e os enums `user_status` / `company_status`.
- **CA-05:** O cadastro de novas empresas aceita `faixa_preco` opcional e persiste o intervalo `numrange` correspondente, enquanto empresas existentes sem `faixa_preco` continuam funcionando normalmente.

