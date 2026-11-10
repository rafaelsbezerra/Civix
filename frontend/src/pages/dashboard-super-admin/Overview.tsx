import { useCallback, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  DollarSign,
  Layers3,
  RefreshCw,
  Users2,
} from 'lucide-react';
import {
  getPlatformOverviewCompanies,
  getPlatformOverviewSales,
  getPlatformUsersMetrics,
} from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { OverviewRevenueCharts } from '../../components/dashboard-super-admin/OverviewRevenueCharts';
import { OverviewHealthAndUsersCharts } from '../../components/dashboard-super-admin/OverviewHealthAndUsersCharts';
import { OverviewRecentActivity } from '../../components/dashboard-super-admin/OverviewRecentActivity';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

export default function Overview() {
  const { session, handleError } = useOutletContext<SuperAdminContext>();

  const [salesRetry, setSalesRetry] = useState(0);
  const [companiesRetry, setCompaniesRetry] = useState(0);
  const [usersRetry, setUsersRetry] = useState(0);

  const loadSales = useCallback(
    () =>
      getPlatformOverviewSales().catch((error) => {
        throw new Error(handleError(error), { cause: error });
      }),
    [handleError],
  );

  const loadCompanies = useCallback(
    () =>
      getPlatformOverviewCompanies().catch((error) => {
        throw new Error(handleError(error), { cause: error });
      }),
    [handleError],
  );

  const loadUsers = useCallback(
    () =>
      getPlatformUsersMetrics().catch((error) => {
        throw new Error(handleError(error), { cause: error });
      }),
    [handleError],
  );

  const salesQuery = useAsyncQuery(`overview-sales:${salesRetry}`, loadSales);
  const companiesQuery = useAsyncQuery(
    `overview-companies:${companiesRetry}`,
    loadCompanies,
  );
  const usersQuery = useAsyncQuery(`overview-users:${usersRetry}`, loadUsers);

  return (
    <div className="space-y-6">
      <div className="sa-page-heading">
        <span className="sa-eyebrow">PLATAFORMA CIVIX</span>
        <h1>
          Visão Geral Executiva
          <br />
          <span>Indicadores e desempenho em tempo real.</span>
        </h1>
        <p>
          Olá, {session.user.name || 'Superadmin'}. Acompanhe as principais métricas de
          faturamento, base de empresas e usuários em um só lugar.
        </p>
      </div>

      {/* 1. Métricas e Gráficos de Faturamento */}
      <section aria-label="Métricas de faturamento e vendas" className="space-y-3">
        {salesQuery.loading ? (
          <Card className="rounded-2xl py-8">
            <CardContent className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
              Carregando indicadores de faturamento…
            </CardContent>
          </Card>
        ) : salesQuery.error ? (
          <Card className="rounded-2xl border-destructive/40 bg-destructive/5 py-4">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-destructive">
              <p>
                Não foi possível carregar o faturamento:{' '}
                {(salesQuery.error as Error).message}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSalesRetry((val) => val + 1)}
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : (
          salesQuery.data && <OverviewRevenueCharts metrics={salesQuery.data} />
        )}
      </section>

      {/* 2. Saúde da Base e Usuários Gerenciados por Perfil */}
      <section aria-label="Saúde da base de empresas e usuários" className="space-y-3">
        {companiesQuery.loading || usersQuery.loading ? (
          <Card className="rounded-2xl py-8">
            <CardContent className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
              Carregando métricas de empresas e usuários…
            </CardContent>
          </Card>
        ) : companiesQuery.error || usersQuery.error ? (
          <Card className="rounded-2xl border-destructive/40 bg-destructive/5 py-4">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-destructive">
              <p>
                Não foi possível carregar a distribuição de empresas e usuários:{' '}
                {((companiesQuery.error || usersQuery.error) as Error).message}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompaniesRetry((val) => val + 1);
                  setUsersRetry((val) => val + 1);
                }}
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : (
          companiesQuery.data &&
          usersQuery.data && (
            <OverviewHealthAndUsersCharts
              companiesMetrics={companiesQuery.data}
              usersMetrics={usersQuery.data}
            />
          )
        )}
      </section>

      {/* 3. Atividade Recente: Últimas Vendas e Últimas Empresas */}
      <section aria-label="Atividade recente da plataforma" className="space-y-3">
        {salesQuery.data && companiesQuery.data && (
          <OverviewRecentActivity
            recentSales={salesQuery.data.recentSales}
            recentCompanies={companiesQuery.data.recentCompanies}
          />
        )}
      </section>

      {/* 4. Ações Rápidas da Plataforma */}
      <section className="sa-overview-actions" aria-label="Operações disponíveis">
        <Link to="/dashboard/super-admin/companies/new" className="sa-action-card">
          <Building2 aria-hidden="true" />
          <span className="sa-eyebrow">EMPRESAS</span>
          <h2>Conecte uma nova empresa.</h2>
          <p>Escolha um plano e confirme o cadastro com o registro da venda inicial.</p>
          <span className="sa-card-link">
            Cadastrar empresa <ArrowUpRight size={18} />
          </span>
        </Link>
        <Link to="/dashboard/super-admin/sales/new" className="sa-action-card">
          <DollarSign aria-hidden="true" />
          <span className="sa-eyebrow">VENDAS</span>
          <h2>Lançamento comercial.</h2>
          <p>Registre uma nova venda manual pelo plano vigente ou por valor avulso.</p>
          <span className="sa-card-link">
            Lançar venda <ArrowUpRight size={18} />
          </span>
        </Link>
        <Link to="/dashboard/super-admin/plans" className="sa-action-card">
          <Layers3 aria-hidden="true" />
          <span className="sa-eyebrow">PLANOS</span>
          <h2>Organize sua oferta.</h2>
          <p>Consulte e administre os planos comerciais disponíveis na Civix.</p>
          <span className="sa-card-link">
            Gerenciar planos <ArrowUpRight size={18} />
          </span>
        </Link>
        <Link to="/dashboard/super-admin/administrators" className="sa-action-card">
          <Users2 aria-hidden="true" />
          <span className="sa-eyebrow">SUPERADMINS</span>
          <h2>Equipe gestora.</h2>
          <p>Convide e administre os superadministradores da plataforma.</p>
          <span className="sa-card-link">
            Gerenciar equipe <ArrowUpRight size={18} />
          </span>
        </Link>
      </section>

      <p className="sa-footnote">
        Todas as métricas financeiras são calculadas em BRL e as datas utilizam o padrão
        UTC.
      </p>
    </div>
  );
}
