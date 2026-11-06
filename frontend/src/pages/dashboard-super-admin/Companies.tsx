import { useCallback, useState, type CSSProperties } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getPlatformCompanies, getPlatformCompanyMetrics } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Button } from '../../components/ui/button';
import { CompanyMetricsCards } from '../../components/dashboard-super-admin/CompanyMetricsCards';
import { CompanyTable } from '../../components/dashboard-super-admin/CompanyTable';
import { CompanyFilters } from '../../components/dashboard-super-admin/CompanyFilters';
import { DashboardPageLoader } from '../../components/dashboard-super-admin/DashboardPageLoader';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

export default function Companies() {
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ q: '', status: '', planId: '' });
  const [retry, setRetry] = useState(0);
  const [metricsRetry, setMetricsRetry] = useState(0);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const load = useCallback(
    () =>
      getPlatformCompanies({ ...filters, page }).catch(error => {
        throw new Error(handleError(error), { cause: error });
      }),
    [filters, page, handleError],
  );
  const loadMetrics = useCallback(
    () =>
      getPlatformCompanyMetrics().catch(error => {
        throw new Error(handleError(error), { cause: error });
      }),
    [handleError],
  );
  const query = useAsyncQuery(JSON.stringify([filters, page, retry]), load);
  const metrics = useAsyncQuery('company-metrics:' + metricsRetry, loadMetrics);

  if (!ready && !query.loading && !metrics.loading && !filtersLoading) {
    setReady(true);
  }

  const theme = {
    '--card': 'var(--sa-surface)',
    '--card-foreground': 'var(--sa-ink)',
    '--popover': 'var(--sa-surface)',
    '--popover-foreground': 'var(--sa-ink)',
    '--input': 'var(--sa-line)',
    '--accent': 'var(--sa-soft)',
    '--accent-foreground': 'var(--sa-ink)',
  } as CSSProperties;

  return (
    <div className="space-y-6 text-foreground" style={theme}>
      {!ready && <DashboardPageLoader label="Carregando empresas…" />}
      <div className={ready ? 'sa-page-enter space-y-6' : 'hidden'}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <div className="order-2 min-w-0 flex-1 xl:order-1">
            {metrics.loading ? (
              <p role="status" className="text-sm text-muted-foreground">
                Carregando métricas…
              </p>
            ) : metrics.error ? (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm"
              >
                <p>Não foi possível carregar as métricas. {(metrics.error as Error).message}</p>
                <Button variant="outline" onClick={() => setMetricsRetry(value => value + 1)}>
                  Tentar novamente métricas
                </Button>
              </div>
            ) : (
              metrics.data && <CompanyMetricsCards metrics={metrics.data} />
            )}
          </div>
          <div className="order-1 flex shrink-0 justify-end xl:order-2">
            <Button
              className="min-h-11 rounded-xl px-4"
              render={<Link to="/dashboard/super-admin/companies/new" />}
              nativeButton={false}
            >
              <Plus aria-hidden="true" />
              Cadastrar empresa
            </Button>
          </div>
        </div>
        <CompanyFilters
          onError={handleError}
          onLoadingChange={setFiltersLoading}
          onApply={value => {
            setPage(1);
            setFilters(value);
          }}
        />
        {query.loading ? (
          <p role="status" className="py-8 text-center text-muted-foreground">
            Carregando empresas…
          </p>
        ) : query.error ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm"
          >
            <p>{(query.error as Error).message}</p>
            <Button variant="outline" onClick={() => setRetry(value => value + 1)}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          query.data && <CompanyTable result={query.data} onPage={setPage} />
        )}
      </div>
    </div>
  );
}
