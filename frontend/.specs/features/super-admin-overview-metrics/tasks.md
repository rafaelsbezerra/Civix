# Visão Geral Executiva do Super Admin (Frontend)

## Objetivo
Instalar o `recharts` e o componente `chart` do `shadcn/ui` no frontend e implementar na página `Overview.tsx` do Super Admin as 6 métricas e listas selecionadas:
1. Faturamento no Mês Atual vs. Mês Anterior
2. Receita Total Acumulada
3. Saúde da Base de Empresas
4. Total de Usuários Gerenciados por Perfil
5. Últimas Vendas Registradas
6. Últimas Empresas Registradas

## Restrições globais
- Não concentrar toda a tela em uma única requisição: consumir separadamente a rota de métricas de usuários por perfil (`GET /api/v1/platform/users/metrics`), a rota de empresas (`GET /api/v1/platform/companies`) e a rota de vendas (`GET /api/v1/platform/sales`).
- Seguir as regras de formatação e legibilidade do `AGENTS.md` (executar `prettier` e `eslint`).
- Manter valores em `BRL` e datas em `UTC`, respeitando o tema claro/escuro do painel de Super Admin.

## Pontos de atenção
- Em ambientes de teste (`jsdom` / Vitest), o `ResponsiveContainer` do `recharts` pode ter dimensões `0x0`; garantir que os textos, valores e rótulos acessíveis (`aria-label`) dos cards e gráficos estejam presentes no DOM para verificação automatizada.

---

## Task 1: Instalar `recharts`, adicionar `components/ui/chart.tsx` e clientes de API em `lib/api.ts`

**Arquivos:**
- Modificar:
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/src/lib/api.ts`
- Criar:
  - `frontend/src/components/ui/chart.tsx`

**Passos:**
- [ ] Instalar `recharts` no pacote `frontend` (após confirmação do usuário para instalação da dependência).
- [ ] Criar `frontend/src/components/ui/chart.tsx` seguindo o padrão `shadcn/ui` (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`).
- [ ] Adicionar em `frontend/src/lib/api.ts`:
  - `getPlatformUsersMetrics()` consumindo `GET /api/v1/platform/users/metrics`;
  - helpers ou funções de agregação no cliente para organizar a **Saúde da Base + Últimas Empresas Registradas** (a partir de `getPlatformCompanies`) e **Receita Acumulada + Mês Atual vs. Mês Anterior + Últimas Vendas** (a partir de `getPlatformSales`).

**Pronto quando:**
- `frontend/src/components/ui/chart.tsx` e `frontend/src/lib/api.ts` compilarem sem erros no TypeScript (`tsc -b`).

**Commit sugerido:**
`feat(frontend): add recharts, shadcn chart component and overview api helpers`

---

## Task 2: Construir os componentes visuais e atualizar `Overview.tsx` com as 6 métricas

**Arquivos:**
- Modificar:
  - `frontend/src/pages/dashboard-super-admin/Overview.tsx`
- Criar:
  - `frontend/src/components/dashboard-super-admin/OverviewRevenueCharts.tsx`
  - `frontend/src/components/dashboard-super-admin/OverviewHealthAndUsersCharts.tsx`
  - `frontend/src/components/dashboard-super-admin/OverviewRecentActivity.tsx`
  - `frontend/src/pages/dashboard-super-admin/Overview.test.tsx`

**Passos:**
- [ ] Criar `OverviewRevenueCharts.tsx` exibindo **Receita Total Acumulada** e **Faturamento no Mês Atual vs. Mês Anterior** com gráfico `BarChart` comparativo no `ChartContainer`.
- [ ] Criar `OverviewHealthAndUsersCharts.tsx` exibindo **Saúde da Base de Empresas** (Ativas, Inativas e Arquivadas com gráfico Donut/Barras) e **Total de Usuários Gerenciados por Perfil** (`super_admin`, `admin_empresa`, `atendente` com gráfico `BarChart`).
- [ ] Criar `OverviewRecentActivity.tsx` exibindo as listas de **Últimas Vendas Registradas** (top 5) e **Últimas Empresas Registradas** (top 5) com links para as respectivas páginas.
- [ ] Atualizar `Overview.tsx` para buscar em paralelo os dados de empresas, vendas e usuários, exibindo os 6 blocos, estados de carregamento/erro independentes e os atalhos de ações rápidas.
- [ ] Criar testes em `Overview.test.tsx` validando a renderização das 6 métricas, listas recentes e tratamento de erro/retentativa.

**Pronto quando:**
- `npm --prefix frontend run test`, `npm --prefix frontend run lint` e `npm --prefix frontend run format:check` passarem sem erros.

**Commit sugerido:**
`feat(super-admin): implement overview dashboard metrics, charts and recent activity`

