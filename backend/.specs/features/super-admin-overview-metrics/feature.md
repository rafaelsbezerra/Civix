# Feature — Visão Geral Executiva do Super Admin (Métricas, Gráficos e Atividade Recente)

- **Identificador:** `super-admin-overview-metrics`
- **Status:** Especificado
- **Data:** 2026-11-08
- **Arquivos da spec (Backend):** [Feature](feature.md) · [SDD](sdd.md) · [Tasks](tasks.md)
- **Spec Frontend pareada:** [`frontend/.specs/features/super-admin-overview-metrics/`](../../../../frontend/.specs/features/super-admin-overview-metrics/feature.md)

---

## 1. Visão geral

Transformar a tela de **Visão Geral** do painel de Super Admin ([`Overview.tsx`](../../../../frontend/src/pages/dashboard-super-admin/Overview.tsx)) em um dashboard executivo com indicadores reais da plataforma Civix, gráficos interativos (`recharts` + componente `chart` do `shadcn/ui`) e listas de atividade recente, sem concentrar toda a tela em um único endpoint monolítico.

A tela combinará:
1. **Rota dedicada para contagem/métricas de usuários gerenciados por perfil:** `GET /api/v1/platform/users/metrics` (protegida por `authMiddleware` e `requireSuperAdmin`), retornando o total global de usuários gerenciados agrupados por perfil (`super_admin`, `admin_empresa`, `atendente`) e por status (`active`, `pending`, `blocked`).
2. **Consumo das rotas existentes de Empresas e Vendas no frontend:**
   - `GET /api/v1/platform/companies` (e `getPlatformCompanyMetrics`) para organizar no frontend a **Saúde da Base de Empresas** (Ativas, Inativas e Arquivadas) e as **Últimas Empresas Registradas** (ordenadas por `data_cadastro` / `createdAt` decrescente).
   - `GET /api/v1/platform/sales` para calcular e exibir no frontend o **Faturamento no Mês Atual vs. Mês Anterior**, a **Receita Total Acumulada** e as **Últimas Vendas Registradas** (ordenadas por `soldAt` decrescente).

---

## 2. Métricas e seções selecionadas

1. **Faturamento no Mês Atual vs. Mês Anterior:**
   - Comparativo em BRL (UTC) entre o mês corrente e o mês imediatamente anterior (`soldAt`), exibindo valor no mês atual, valor no mês anterior, variação percentual e gráfico comparativo em barras (`BarChart` do `recharts`).
2. **Receita Total Acumulada:**
   - Soma histórica de todas as vendas ativas (`amount` em BRL) e quantidade total de vendas registradas.
3. **Saúde da Base de Empresas:**
   - Total de empresas cadastradas e distribuição entre **Ativas** (`deleted_at === null && status !== 'inativo'`), **Inativas/Suspensas** (`deleted_at === null && status === 'inativo'`) e **Arquivadas** (`deleted_at !== null`), acompanhada de gráfico visual de proporção (`PieChart` / Donut ou `BarChart` via `recharts`).
4. **Total de Usuários Gerenciados por Perfil:**
   - Contagem global de contas não excluídas (`deleted_at IS NULL`) nos perfis gerenciados pelo Super Admin (`super_admin`, `admin_empresa`, `atendente`), detalhando quantos estão `active`, `pending` (aguardando definição de senha) e `blocked`, com gráfico comparativo por perfil.
5. **Últimas Vendas Registradas:**
   - Lista das 5 vendas mais recentes (ordenadas por `soldAt` decrescente), exibindo empresa, plano/origem, data em UTC e valor em BRL, com atalho para `/dashboard/super-admin/sales`.
6. **Últimas Empresas Registradas:**
   - Lista das 5 empresas mais recentes (ordenadas por `data_cadastro` / `createdAt` decrescente), exibindo nome, CNPJ, cidade/UF, status e link direto para `/dashboard/super-admin/companies/:id`.

---

## 3. Observações de arquitetura, banco e dependências

- **Dependências de gráficos no Frontend:**
  - Atualmente o `frontend/package.json` não possui biblioteca de gráficos instalada.
  - Será instalado o pacote **`recharts`** no diretório `frontend` e adicionado o wrapper padrão **`chart.tsx`** do `shadcn/ui` (`frontend/src/components/ui/chart.tsx`), integrado às variáveis de tema claro/escuro do Super Admin (`--sa-surface`, `--sa-ink`, `--primary`).
- **Múltiplas fontes independentes (sem requisição única monolítica):**
  - Conforme decisão de arquitetura definida pelo usuário, a tela **não** dependerá de uma única rota que monte toda a página.
  - O frontend buscará:
    - `GET /api/v1/platform/users/metrics` para os dados agregados de usuários por perfil;
    - `GET /api/v1/platform/companies` (via `getPlatformCompanies` / `getPlatformCompanyMetrics`) para organizar a saúde da base e as últimas empresas no cliente;
    - `GET /api/v1/platform/sales` (paginando os registros existentes) para organizar a receita acumulada, o comparativo mensal e as últimas vendas no cliente.
- **Compatibilidade com `user_role` e `user_status` em UPPER CASE no PostgreSQL:**
  - A nova consulta `getManagedUsersMetrics()` em `userPostgresRepository` agrupará `role` (`'SUPER_ADMIN'`, `'ADMIN_EMPRESA'`, `'ATENDENTE'`) e `COALESCE(status::text, 'ACTIVE')` diretamente no SQL (`WHERE deleted_at IS NULL`) e normalizará as chaves para lowercase no retorno da camada de serviço.
- **Migration pendente `20261108000200_drop_company_is_verified`:**
  - Os arquivos `migration.sql` e `down.sql` para remoção da coluna `companies.is_verified` já foram criados; qualquer remoção do campo `is_verified` das queries SQL de `company.repository.ts` e do seed permanece separada desta entrega de métricas, a menos que solicitada em conjunto.

---

## 4. Decisões confirmadas

| ID | Decisão |
| --- | --- |
| **OM-D01** | Instalar `recharts` no pacote `frontend` e criar `frontend/src/components/ui/chart.tsx` seguindo o padrão `shadcn/ui`. |
| **OM-D02** | Não criar um endpoint único para toda a tela de Overview; criar `GET /api/v1/platform/users/metrics` para a contagem global de usuários por perfil e utilizar as respostas das rotas de empresas (`/api/v1/platform/companies`) e vendas (`/api/v1/platform/sales`) para organizar os demais indicadores no frontend. |
| **OM-D03** | Exibir exatamente os 6 blocos selecionados: (1) Faturamento no Mês Atual vs. Mês Anterior, (2) Receita Total Acumulada, (3) Saúde da Base de Empresas, (4) Total de Usuários Gerenciados por Perfil, (5) Últimas Vendas Registradas e (6) Últimas Empresas Registradas, mantendo também os atalhos operacionais rápidos. |

---

## 5. Critérios de aceite

- **CA-01:** `GET /api/v1/platform/users/metrics` exige autenticação de `super_admin` ativo (retornando `401`/`403` para outros perfis) e retorna a contagem de usuários não removidos (`deleted_at IS NULL`) por perfil (`super_admin`, `admin_empresa`, `atendente`) e por status (`active`, `pending`, `blocked`), tanto no modo PostgreSQL quanto no modo JSON (`USE_MOCK_DATA=true`).
- **CA-02:** O pacote `recharts` está instalado em `frontend/package.json` e o componente `frontend/src/components/ui/chart.tsx` compila sem erros no TypeScript (`tsc -b`).
- **CA-03:** A tela `Overview.tsx` carrega de forma independente as métricas de empresas, vendas e usuários por perfil, exibindo os cards numéricos, os gráficos (`recharts` + `shadcn/ui`) e as tabelas/listas das últimas 5 vendas e últimas 5 empresas registradas.
- **CA-04:** Todas as datas seguem UTC e todos os valores monetários são formatados em `BRL` (`pt-BR`).

