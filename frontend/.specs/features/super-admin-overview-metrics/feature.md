# Feature — Visão Geral Executiva do Super Admin (Métricas, Gráficos e Atividade Recente)

- **Identificador:** `super-admin-overview-metrics`
- **Status:** Especificado
- **Data:** 2026-11-08
- **Arquivos da spec (Frontend):** [Feature](feature.md) · [SDD](sdd.md) · [Tasks](tasks.md)
- **Spec Backend pareada:** [`backend/.specs/features/super-admin-overview-metrics/`](../../../../backend/.specs/features/super-admin-overview-metrics/feature.md)

---

## 1. Contexto e Objetivo

Atualmente, a página inicial do painel do Super Admin ([`Overview.tsx`](../../../src/pages/dashboard-super-admin/Overview.tsx)) apresenta apenas a saudação inicial e dois atalhos estáticos ("Cadastrar empresa" e "Gerenciar planos").

Esta feature evolui a tela **Visão Geral** para apresentar **6 métricas e blocos executivos** com gráficos interativos baseados em **`recharts`** e no componente **`chart` do `shadcn/ui`**, consumindo múltiplas rotas em paralelo (sem concentrar toda a tela em uma única requisição):

1. **Faturamento no Mês Atual vs. Mês Anterior** (com gráfico comparativo e variação percentual).
2. **Receita Total Acumulada** (soma histórica de vendas em BRL e volume total de transações).
3. **Saúde da Base de Empresas** (total, ativas, inativas/suspensas e arquivadas, com gráfico visual de distribuição).
4. **Total de Usuários Gerenciados por Perfil** (`super_admin`, `admin_empresa` e `atendente`, detalhando ativos, pendentes de convite e bloqueados, com gráfico por perfil).
5. **Últimas Vendas Registradas** (lista das 5 vendas mais recentes com link para a área de vendas).
6. **Últimas Empresas Registradas** (lista das 5 empresas mais recentes com link para o detalhe de cada empresa).

---

## 2. Instalações e Dependências Necessárias

No pacote `frontend`:
- **Biblioteca de gráficos:** instalar **`recharts`** (`npm --prefix frontend install recharts`).
- **Componente `shadcn/ui`:** criar [`frontend/src/components/ui/chart.tsx`](../../../src/components/ui/chart.tsx) (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent` e `ChartConfig`), compatível com React 19, Tailwind CSS v4 e o tema claro/escuro do Super Admin (`--sa-surface`, `--sa-ink`, `--primary`).

---

## 3. Fontes de Dados (Múltiplas Requisições Independentes)

Em vez de criar uma única rota monolítica para a página inteira, o frontend organizará os dados a partir de **3 frentes independentes**:

1. **Rota de Empresas (`GET /api/v1/platform/companies`):**
   - Busca todas as páginas de empresas cadastradas na plataforma e organiza no cliente:
     - **Saúde da Base de Empresas:** contagem de `total`, `active`, `inactive` e `archived`.
     - **Últimas Empresas Registradas:** ordenação decrescente por `createdAt` / `data_cadastro` exibindo as 5 mais recentes.
2. **Rota de Vendas (`GET /api/v1/platform/sales`):**
   - Busca as vendas da plataforma e organiza no cliente:
     - **Receita Total Acumulada:** soma de `Number(sale.amount)` e total de vendas.
     - **Faturamento no Mês Atual vs. Mês Anterior:** soma das vendas cujo `soldAt` (em UTC) pertence ao mês corrente (`YYYY-MM`) comparada à soma das vendas do mês anterior, calculando a diferença e o percentual de variação, além da série para o gráfico comparativo.
     - **Últimas Vendas Registradas:** as 5 vendas mais recentes (ordenadas por `soldAt` decrescente).
3. **Nova Rota de Usuários por Perfil (`GET /api/v1/platform/users/metrics`):**
   - Retorna a contagem global de usuários gerenciados (`super_admin`, `admin_empresa`, `atendente`) separados por status (`active`, `pending`, `blocked`), alimentando o card e o gráfico de **Total de Usuários Gerenciados por Perfil**.

---

## 4. Requisitos Funcionais (UI/UX)

- **RF-01 — Cards de Indicadores Principais (Topo):**
  - Exibir em destaque:
    1. **Receita Total Acumulada** (valor em `BRL` com `CountUpNumber` e total de vendas).
    2. **Faturamento no Mês Atual vs. Mês Anterior** (valor do mês atual em `BRL`, comparativo com o mês anterior e badge de variação percentual).
    3. **Saúde da Base de Empresas** (total de empresas, percentual ativo e contadores de ativas, inativas e arquivadas).
    4. **Total de Usuários Gerenciados** (total de contas gerenciadas e resumo de ativos, aguardando senha e bloqueados).
- **RF-02 — Seção de Gráficos (`recharts` + `shadcn/ui`):**
  - **Gráfico 1 — Faturamento: Mês Anterior vs. Mês Atual (`BarChart`):** compara lado a lado a receita e o volume do mês anterior com o mês atual em UTC, com `ChartTooltipContent` formatado em BRL.
  - **Gráfico 2 — Saúde da Base de Empresas (`PieChart` Donut ou `BarChart`):** exibe visualmente a proporção entre empresas **Ativas**, **Inativas** e **Arquivadas**.
  - **Gráfico 3 — Usuários Gerenciados por Perfil (`BarChart` empilhado/agrupado):** compara `Superadmin`, `Admin da empresa` e `Atendente` mostrando a distribuição de status (`Ativos`, `Aguardando senha`, `Desativados`).
- **RF-03 — Seção de Atividade Recente (Listas/Tabelas):**
  - **Últimas Vendas Registradas:** até 5 registros mais recentes com nome da empresa, plano/origem, data em UTC e valor em BRL, mais botão/link "Ver todas as vendas" (`/dashboard/super-admin/sales`).
  - **Últimas Empresas Registradas:** até 5 empresas mais recentes com nome, cidade/UF, data de cadastro em UTC, badge de status e link para `/dashboard/super-admin/companies/:id`, mais link "Ver todas as empresas" (`/dashboard/super-admin/companies`).
- **RF-04 — Resiliência Independente:**
  - Como os dados vêm de requisições separadas, se uma fonte falhar (ex.: falha ao carregar métricas de usuários), o card correspondente exibe estado de erro com botão **"Tentar novamente"** sem impedir a exibição dos demais blocos carregados com sucesso.
- **RF-05 — Atalhos Operacionais:**
  - Preservar os atalhos rápidos da Visão Geral para **Cadastrar empresa** (`/dashboard/super-admin/companies/new`), **Lançar venda manual** (`/dashboard/super-admin/sales/new`) e **Gerenciar planos** (`/dashboard/super-admin/plans`).

