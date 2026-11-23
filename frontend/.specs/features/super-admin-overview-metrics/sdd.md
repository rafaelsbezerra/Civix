# SDD — Visão Geral Executiva do Super Admin (Frontend)

- **Feature:** [feature.md](feature.md)
- **Tasks:** [tasks.md](tasks.md)
- **Spec Backend pareada:** [`backend/.specs/features/super-admin-overview-metrics/sdd.md`](../../../../backend/.specs/features/super-admin-overview-metrics/sdd.md)

---

## 1. Instalação e Componente de Gráficos (`shadcn/ui` + `recharts`)

1. **Dependência:**
   - Adicionar `recharts` em [`frontend/package.json`](../../../package.json).
2. **Componente [`frontend/src/components/ui/chart.tsx`](../../../src/components/ui/chart.tsx):**
   - Implementar os utilitários padrão do `shadcn/ui`:
     - `ChartConfig`
     - `ChartContainer` (com `ResponsiveContainer` do `recharts` e injeção de variáveis CSS `--color-<key>`)
     - `ChartTooltip` e `ChartTooltipContent`
     - `ChartLegend` e `ChartLegendContent`

---

## 2. Contratos e Funções de API (`frontend/src/lib/api.ts`)

### 2.1. Métricas de Usuários Gerenciados (`GET /api/v1/platform/users/metrics`)

```typescript
export interface RoleUsersBreakdown {
  role: 'super_admin' | 'admin_empresa' | 'atendente';
  total: number;
  active: number;
  pending: number;
  blocked: number;
}

export interface ManagedUsersMetrics {
  total: number;
  active: number;
  pending: number;
  blocked: number;
  byRole: RoleUsersBreakdown[];
}

export async function getPlatformUsersMetrics(): Promise<ManagedUsersMetrics>;
```

### 2.2. Organização dos Dados de Empresas no Frontend (`getPlatformCompaniesOverview`)

Utiliza a rota existente `GET /api/v1/platform/companies` (paginando com `limit: 100` até `totalPages`) para derivar no frontend:
- `health`:
  - `total`: total de empresas
  - `active`: `deleted_at == null && status !== 'inativo'`
  - `inactive`: `deleted_at == null && status === 'inativo'`
  - `archived`: `deleted_at != null`
- `recentCompanies`:
  - Ordena uma cópia do array de empresas por `Date.parse(company.createdAt || company.data_cadastro || '1970-01-01T00:00:00.000Z')` em ordem decrescente (desempatando por `id`) e retorna as **5 mais recentes**.

### 2.3. Organização dos Dados de Vendas no Frontend (`getPlatformSalesOverview`)

Utiliza a rota existente `GET /api/v1/platform/sales` (paginando com `limit: 100` até `totalPages`) para derivar no frontend:
- `totalRevenue`: soma de `Number(sale.amount || 0)` de todas as vendas.
- `totalSalesCount`: `sales.length`.
- `currentMonthRevenue` e `currentMonthCount`: vendas cujo `soldAt` pertence ao ano/mês UTC atual (`now.getUTCFullYear()`, `now.getUTCMonth()`).
- `previousMonthRevenue` e `previousMonthCount`: vendas cujo `soldAt` pertence ao mês UTC imediatamente anterior (se janeiro, dezembro do ano anterior).
- `monthOverMonthChangePercent`:
  - Se `previousMonthRevenue > 0`: `Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)`.
  - Se `previousMonthRevenue === 0 && currentMonthRevenue > 0`: `null` (exibido como `"Novo no mês"` / sem base anterior para percentual).
  - Se ambos forem `0`: `0`.
- `recentSales`: as **5 primeiras vendas** ordenadas por `Date.parse(sale.soldAt)` decrescente.

---

## 3. Componentes da Visão Geral

| Arquivo | Responsabilidade |
| --- | --- |
| [`frontend/src/components/ui/chart.tsx`](../../../src/components/ui/chart.tsx) | Primitivas de gráfico do `shadcn/ui` sobre `recharts` |
| [`frontend/src/components/dashboard-super-admin/OverviewRevenueCharts.tsx`](../../../src/components/dashboard-super-admin/OverviewRevenueCharts.tsx) | Cards de **Receita Total Acumulada** e **Faturamento no Mês Atual vs. Mês Anterior** + gráfico `BarChart` comparando Mês Anterior e Mês Atual |
| [`frontend/src/components/dashboard-super-admin/OverviewHealthAndUsersCharts.tsx`](../../../src/components/dashboard-super-admin/OverviewHealthAndUsersCharts.tsx) | Card/gráfico de **Saúde da Base de Empresas** (`PieChart` Donut / barras) e Card/gráfico de **Total de Usuários Gerenciados por Perfil** (`BarChart` por `super_admin`, `admin_empresa`, `atendente`) |
| [`frontend/src/components/dashboard-super-admin/OverviewRecentActivity.tsx`](../../../src/components/dashboard-super-admin/OverviewRecentActivity.tsx) | Listas/tabelas de **Últimas Vendas Registradas** (top 5) e **Últimas Empresas Registradas** (top 5) com links de navegação |
| [`frontend/src/pages/dashboard-super-admin/Overview.tsx`](../../../src/pages/dashboard-super-admin/Overview.tsx) | Orquestração das consultas independentes (`useAsyncQuery`), estados de carregamento/erro por seção, exibição das métricas/gráficos e atalhos rápidos |

