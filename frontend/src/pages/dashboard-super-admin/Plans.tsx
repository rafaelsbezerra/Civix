import { useEffect, useState, type CSSProperties } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Plus, Power, Search } from 'lucide-react';
import {
  getPlatformPlans,
  savePlatformPlan,
  setPlatformPlanActive,
  type Plan,
  type PlanInput,
} from '../../lib/api';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { PlanForm } from '../../components/dashboard-super-admin/PlanForm';
import { CountUpNumber } from '../../components/dashboard-super-admin/CountUpNumber';
import { DashboardPageLoader } from '../../components/dashboard-super-admin/DashboardPageLoader';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

const periods = { monthly: 'Mensal', yearly: 'Anual', one_time: 'Único' } as const;

const theme = {
  '--card': 'var(--sa-surface)',
  '--card-foreground': 'var(--sa-ink)',
  '--popover': 'var(--sa-surface)',
  '--popover-foreground': 'var(--sa-ink)',
  '--input': 'var(--sa-line)',
  '--accent': 'var(--sa-soft)',
  '--accent-foreground': 'var(--sa-ink)',
} as CSSProperties;

export default function Plans() {
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<Plan | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    getPlatformPlans()
      .then((data) => {
        if (active) {
          setLoadFailed(false);
          setPlans(data);
          setError('');
        }
      })
      .catch((failure) => {
        if (active) {
          setLoadFailed(true);
          setError(handleError(failure));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [retry, handleError]);

  const save = async (input: PlanInput) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const saved = await savePlatformPlan(
        input,
        editor && editor !== 'new' ? editor.id : undefined,
      );
      setPlans((current) =>
        [...current.filter((plan) => plan.id !== saved.id), saved].sort(
          (a, b) => a.displayOrder - b.displayOrder,
        ),
      );
      setEditor(null);
      setNotice('Plano salvo com sucesso.');
    } catch (failure) {
      setError(handleError(failure));
    } finally {
      setBusy(false);
    }
  };

  const activate = async (plan: Plan) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const saved = await setPlatformPlanActive(plan.id, !plan.isActive);
      setPlans((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );
      setNotice(
        saved.isActive ? 'Plano ativado.' : 'Plano desativado para novos cadastros.',
      );
    } catch (failure) {
      setError(handleError(failure));
    } finally {
      setBusy(false);
    }
  };

  const visible = plans.filter((plan) =>
    (plan.name + ' ' + plan.slug).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div style={theme} className="space-y-6">
      {loading && <DashboardPageLoader label="Carregando planos…" />}
      <div className={!loading ? 'sa-page-enter space-y-6' : 'hidden'}>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            className="min-h-11 rounded-xl px-5"
            onClick={() => {
              setEditor('new');
              setNotice('');
            }}
          >
            <Plus aria-hidden="true" />
            Novo plano
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                setRetry((value) => value + 1);
              }}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {notice && (
          <p
            role="status"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-200"
          >
            {notice}
          </p>
        )}

        {editor && (
          <PlanForm
            key={editor === 'new' ? 'new' : editor.id}
            plan={editor === 'new' ? undefined : editor}
            busy={busy}
            onSave={save}
            onCancel={() => setEditor(null)}
          />
        )}

        <Card
          role="region"
          aria-label="Planos cadastrados"
          className="gap-0 rounded-2xl py-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold">Catálogo de planos</h2>
              <Badge
                variant="outline"
                className="rounded-full px-2.5 py-0.5 text-xs tabular-nums"
              >
                <CountUpNumber value={plans.length} />
              </Badge>
            </div>
            <label htmlFor="plan-search" className="relative block w-full sm:w-72">
              <span className="sr-only">Buscar planos</span>
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="plan-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome ou identificador"
                className="h-10 pl-9"
              />
            </label>
          </div>

          {loading ? (
            <CardContent className="py-10 text-sm text-muted-foreground" role="status">
              Carregando planos…
            </CardContent>
          ) : loadFailed ? (
            <CardContent className="py-10 text-sm text-muted-foreground">
              Não foi possível carregar o catálogo. Tente novamente.
            </CardContent>
          ) : !plans.length ? (
            <CardContent className="space-y-1 py-10">
              <h3 className="text-sm font-semibold">Nenhum plano cadastrado.</h3>
              <p className="text-sm text-muted-foreground">
                Crie um plano para começar os cadastros comerciais.
              </p>
            </CardContent>
          ) : !visible.length ? (
            <CardContent className="py-10 text-sm text-muted-foreground">
              Nenhum plano encontrado para esta busca.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="px-6 font-medium text-muted-foreground">
                    Plano
                  </TableHead>
                  <TableHead className="px-6 font-medium text-muted-foreground">
                    Preço
                  </TableHead>
                  <TableHead className="px-6 font-medium text-muted-foreground">
                    Período
                  </TableHead>
                  <TableHead className="px-6 font-medium text-muted-foreground">
                    Disponibilidade
                  </TableHead>
                  <TableHead className="px-6 text-right font-medium text-muted-foreground">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="px-6 py-4">
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-xs text-muted-foreground">{plan.slug}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(plan.price))}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {periods[plan.billingPeriod]}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          plan.isActive
                            ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/12 text-amber-800 dark:text-amber-300'
                        }
                      >
                        {plan.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-10"
                          disabled={busy}
                          onClick={() => setEditor(plan)}
                          aria-label={`Editar ${plan.name}`}
                          title={`Editar ${plan.name}`}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-10"
                          disabled={busy}
                          onClick={() => activate(plan)}
                          aria-label={`${plan.isActive ? 'Desativar' : 'Ativar'} ${plan.name}`}
                          title={`${plan.isActive ? 'Desativar' : 'Ativar'} ${plan.name}`}
                        >
                          <Power aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
