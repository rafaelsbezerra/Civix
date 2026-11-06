import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  createManualSale,
  getPlatformCompany,
  getPlatformPlans,
  type ManualSaleDraft,
  type PlatformSale,
} from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CompanyPicker } from '../../components/dashboard-super-admin/CompanyPicker';
import { SaleForm } from '../../components/dashboard-super-admin/SaleForm';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

const theme = {
  '--card': 'var(--sa-surface)',
  '--card-foreground': 'var(--sa-ink)',
  '--popover': 'var(--sa-surface)',
  '--popover-foreground': 'var(--sa-ink)',
  '--input': 'var(--sa-line)',
  '--accent': 'var(--sa-soft)',
  '--accent-foreground': 'var(--sa-ink)',
} as CSSProperties;

export default function SaleCreate() {
  const [search] = useSearchParams();
  const [companyId, setCompanyId] = useState(search.get('companyId') || '');
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlatformSale | null>(null);
  const [retry, setRetry] = useState(0);
  const operation = useRef<{ id: string; payload: string } | null>(null);

  const load = useCallback(
    () =>
      companyId
        ? Promise.all([getPlatformCompany(companyId), getPlatformPlans()])
            .then(([company, plans]) => ({ company, plans }))
            .catch(failure => {
              throw new Error(handleError(failure), { cause: failure });
            })
        : Promise.resolve(null),
    [companyId, handleError],
  );

  const query = useAsyncQuery(companyId + ':' + retry, load);

  const save = async (input: ManualSaleDraft) => {
    if (busy) return;
    const payload = JSON.stringify(input);
    if (!operation.current || operation.current.payload !== payload) {
      operation.current = { id: crypto.randomUUID(), payload };
    }
    setBusy(true);
    setError('');
    try {
      setResult((await createManualSale({ ...input, operationId: operation.current.id })).sale);
    } catch (failure) {
      setError(handleError(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={theme} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          className="min-h-10 rounded-xl px-4"
          render={<Link to="/dashboard/super-admin/sales" role="link" />}
          nativeButton={false}
        >
          <ArrowLeft aria-hidden="true" />
          Vendas
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {result ? (
        <Card role="region" aria-label="Venda registrada" className="rounded-2xl">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              <h2>Venda registrada.</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(Number(result.amount))}
            </p>
            <p className="text-sm text-muted-foreground">
              Data comercial: {new Date(result.soldAt).toISOString()} UTC
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="min-h-10"
                render={<Link to="/dashboard/super-admin/sales" role="link" />}
                nativeButton={false}
              >
                Consultar vendas
              </Button>
              <Button
                type="button"
                className="min-h-10"
                onClick={() => {
                  setResult(null);
                  operation.current = null;
                }}
              >
                Novo lançamento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <CompanyPicker
            selectedId={companyId}
            onError={handleError}
            onSelect={company => {
              setCompanyId(company.id);
              operation.current = null;
              setError('');
            }}
          />
          {companyId &&
            (query.loading ? (
              <p role="status" className="py-6 text-sm text-muted-foreground">
                Carregando plano da empresa…
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
              query.data &&
              (query.data.company.deleted_at || query.data.company.status === 'inativo' ? (
                <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  Empresa indisponível para novo lançamento.
                </p>
              ) : (
                <SaleForm
                  key={companyId}
                  company={query.data.company}
                  plan={query.data.plans.find(plan => plan.id === query.data!.company.plan_id)}
                  busy={busy}
                  onSave={save}
                />
              ))
            ))}
        </>
      )}
    </div>
  );
}
