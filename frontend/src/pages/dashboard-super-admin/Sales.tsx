import { useCallback, useState, type CSSProperties, type FormEvent } from 'react';
import { Building2, Plus, Search, Trash2, X } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { deletePlatformSale, getPlatformSales, type Plan, type PlatformSale } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Field, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { ActionConfirmation } from '../../components/dashboard-super-admin/ActionConfirmation';
import { CompanyPagination } from '../../components/dashboard-super-admin/CompanyPagination';
import { CompanyPicker } from '../../components/dashboard-super-admin/CompanyPicker';
import { DashboardPageLoader } from '../../components/dashboard-super-admin/DashboardPageLoader';
import { PlanFilter } from '../../components/dashboard-super-admin/PlanFilter';
import { SalesMetricsCards } from '../../components/dashboard-super-admin/SalesMetricsCards';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

const ORIGIN_LABELS: Record<string, string> = {
  '': 'Todas',
  manual: 'Manual',
  company_creation: 'Cadastro da empresa',
};

const theme = {
  '--card': 'var(--sa-surface)',
  '--card-foreground': 'var(--sa-ink)',
  '--popover': 'var(--sa-surface)',
  '--popover-foreground': 'var(--sa-ink)',
  '--input': 'var(--sa-line)',
  '--accent': 'var(--sa-soft)',
  '--accent-foreground': 'var(--sa-ink)',
} as CSSProperties;

export default function Sales() {
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState({
    companyId: '',
    planId: '',
    origin: '',
    from: '',
    to: '',
  });
  const [draftPlanId, setDraftPlanId] = useState('');
  const [draftOrigin, setDraftOrigin] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState<PlatformSale | null>(null);
  const [picker, setPicker] = useState(false);

  const load = useCallback(
    () =>
      getPlatformSales({ ...filters, page }).catch(error => {
        throw new Error(handleError(error), { cause: error });
      }),
    [filters, page, handleError],
  );

  const query = useAsyncQuery(JSON.stringify([filters, page, retry]), load);

  if (!ready && !query.loading && !plansLoading) {
    setReady(true);
  }

  const filter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const from = String(values.get('from') || '');
    const to = String(values.get('to') || '');
    setFilters(current => ({
      ...current,
      planId: draftPlanId,
      origin: draftOrigin,
      from: from ? new Date(from + 'Z').toISOString() : '',
      to: to ? new Date(to + 'Z').toISOString() : '',
    }));
    setPage(1);
  };

  return (
    <div ref={setPortal} style={theme} className="space-y-6">
      {!ready && <DashboardPageLoader label="Carregando vendas…" />}
      <div className={ready ? 'sa-page-enter space-y-6' : 'hidden'}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="order-2 min-w-0 flex-1 xl:order-1">
          <SalesMetricsCards sales={query.data?.data ?? []} plans={plans} />
        </div>
        <div className="order-1 flex shrink-0 justify-end xl:order-2">
          <Button
            className="min-h-11 rounded-xl px-5"
            render={<Link to="/dashboard/super-admin/sales/new" role="link" />}
            nativeButton={false}
          >
            <Plus aria-hidden="true" />
            Lançar venda manual
          </Button>
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-200"
        >
          <span>{notice}</span>
          <Link to="/dashboard/super-admin/sales/new" className="underline">
            Fazer novo lançamento
          </Link>
        </p>
      )}

      <Card className="rounded-2xl py-5">
        <CardContent className="space-y-4">
          <form
            onSubmit={filter}
            aria-label="Filtrar vendas"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-end"
          >
            <PlanFilter
              onError={handleError}
              value={draftPlanId}
              onValueChange={setDraftPlanId}
              portalContainer={portal}
              onPlansLoaded={setPlans}
              onLoadingChange={setPlansLoading}
            />

            <Field>
              <FieldLabel htmlFor="sales-origin-filter">Origem</FieldLabel>
              <Select
                value={draftOrigin || '__all__'}
                onValueChange={value => setDraftOrigin(!value || value === '__all__' ? '' : value)}
              >
                <SelectTrigger
                  id="sales-origin-filter"
                  aria-label="Origem"
                  className="h-10 w-full bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50"
                >
                  <SelectValue>{ORIGIN_LABELS[draftOrigin] ?? 'Todas'}</SelectValue>
                </SelectTrigger>
                <SelectContent container={portal} alignItemWithTrigger={false}>
                  <SelectItem value="__all__">Todas</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="company_creation">Cadastro da empresa</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="sales-from-filter">De (UTC)</FieldLabel>
              <Input
                id="sales-from-filter"
                type="datetime-local"
                name="from"
                className="h-10"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sales-to-filter">Até (UTC)</FieldLabel>
              <Input
                id="sales-to-filter"
                type="datetime-local"
                name="to"
                className="h-10"
              />
            </Field>

            <Button type="submit" className="min-h-10 px-5">
              <Search aria-hidden="true" />
              Filtrar
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPicker(value => !value)}
            >
              <Building2 aria-hidden="true" />
              Filtrar por empresa
            </Button>
            {companyName && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1 text-sm">
                <span>{companyName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setFilters(current => ({ ...current, companyId: '' }));
                    setCompanyName('');
                    setPage(1);
                  }}
                >
                  <X aria-hidden="true" />
                  Limpar empresa
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {picker && (
        <CompanyPicker
          selectedId={filters.companyId}
          includeArchived
          onError={handleError}
          onSelect={company => {
            setFilters(current => ({ ...current, companyId: company.id }));
            setCompanyName(company.nome);
            setPage(1);
            setPicker(false);
          }}
        />
      )}

      {query.loading ? (
        <p role="status" className="py-8 text-center text-sm text-muted-foreground">
          Carregando vendas…
        </p>
      ) : query.error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{(query.error as Error).message}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRetry(value => value + 1)}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <Card role="region" aria-label="Vendas comerciais" className="gap-0 rounded-2xl py-0">
          {!query.data?.data.length ? (
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma venda encontrada.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="px-6 font-medium text-muted-foreground">
                    Empresa / plano
                  </TableHead>
                  <TableHead className="px-6 font-medium text-muted-foreground">Valor</TableHead>
                  <TableHead className="px-6 font-medium text-muted-foreground">Origem</TableHead>
                  <TableHead className="px-6 font-medium text-muted-foreground">
                    Data comercial UTC
                  </TableHead>
                  <TableHead className="px-6 text-right font-medium text-muted-foreground">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="px-6 py-4">
                      <Link
                        className="font-medium underline-offset-4 hover:underline"
                        to={'/dashboard/super-admin/companies/' + sale.companyId}
                      >
                        {sale.companyName || 'Consultar empresa'}
                      </Link>
                      <small className="block text-xs text-muted-foreground">
                        {sale.planName || 'Valor manual justificado'}
                      </small>
                      <details className="mt-1 text-xs text-muted-foreground">
                        <summary className="cursor-pointer font-medium">Detalhes da venda</summary>
                        <div className="mt-1 space-y-0.5 pl-2">
                          <p>{sale.description || 'Sem descrição adicional.'}</p>
                          <p>Criada em {new Date(sale.createdAt).toISOString()} UTC</p>
                          <p>
                            Modo:{' '}
                            {sale.pricingMode === 'company_plan'
                              ? 'Plano vigente'
                              : 'Valor manual'}
                          </p>
                        </div>
                      </details>
                    </TableCell>
                    <TableCell className="px-6 py-4 font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(sale.amount))}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline">
                        {sale.origin === 'manual' ? 'Manual' : 'Cadastro da empresa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(sale.soldAt).toISOString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-10 text-destructive hover:text-destructive"
                        aria-label="Excluir definitivamente"
                        title="Excluir definitivamente"
                        onClick={() => setDeleting(sale)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {query.data && <CompanyPagination meta={query.data.meta} onPage={setPage} />}
        </Card>
      )}

      {deleting && (
        <ActionConfirmation
          title="Excluir venda definitivamente"
          description={
            'Esta venda de ' +
            deleting.amount +
            ' BRL será removida do banco. A empresa e o plano serão preservados. A correção exige novo lançamento manual.'
          }
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await deletePlatformSale(deleting.id);
              setPage(1);
              setRetry(value => value + 1);
              setNotice('Venda excluída definitivamente.');
            } catch (error) {
              throw new Error(handleError(error), { cause: error });
            }
          }}
        />
      )}
      </div>
    </div>
  );
}
