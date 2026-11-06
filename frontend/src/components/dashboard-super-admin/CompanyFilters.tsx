import { useCallback, useEffect, useId, useState } from 'react';
import { Search } from 'lucide-react';
import { getPlatformPlans } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

const selectClass = 'w-full min-h-11 border-input! bg-muted/40 text-foreground hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50';
export function CompanyFilters({ onError, onApply, onLoadingChange }: {
  onError: (error: unknown) => string; onApply: (filters: { q: string; status: string; planId: string }) => void; onLoadingChange?: (loading: boolean) => void;
}) {
  const [retry, setRetry] = useState(0);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const id = useId();
  const load = useCallback(() => getPlatformPlans().catch(error => { throw new Error(onError(error), { cause: error }); }), [onError]);
  const plans = useAsyncQuery('company-filter-plans:' + retry, load);
  useEffect(() => {
    onLoadingChange?.(plans.loading);
  }, [plans.loading, onLoadingChange]);
  const statuses = [{ value: '', label: 'Todos' }, { value: 'ativo', label: 'Ativas' }, { value: 'inativo', label: 'Inativas' }, { value: 'archived', label: 'Arquivadas' }];
  const planOptions = [{ value: '', label: plans.loading ? 'Carregando planos…' : 'Todos os planos' }, ...(plans.data ?? []).map(plan => ({ value: plan.id, label: plan.name + (plan.isActive ? '' : ' (inativo)') }))];
  return <div ref={setPortal}><Card className="rounded-2xl py-5"><CardContent className="px-5">
    <form aria-label="Filtrar empresas" className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.5fr)_1fr_1fr_auto]" onSubmit={event => {
      event.preventDefault(); const values = new FormData(event.currentTarget);
      onApply({ q: String(values.get('q') || ''), status: String(values.get('status') || ''), planId: String(values.get('planId') || '') });
    }}>
      <label className="grid gap-2 text-sm font-medium">Nome ou CNPJ<Input name="q" maxLength={200} className="h-11" /></label>
      <div className="grid gap-2 text-sm font-medium"><label htmlFor={id + '-status'}>Estado do cadastro</label><Select name="status" defaultValue="" items={statuses}><SelectTrigger id={id + '-status'} className={selectClass}><SelectValue /></SelectTrigger><SelectContent container={portal} alignItemWithTrigger={false}>{statuses.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-2 text-sm font-medium"><label htmlFor={id + '-plan'}>Plano</label><Select name="planId" defaultValue="" items={planOptions} disabled={plans.loading || !!plans.error}><SelectTrigger id={id + '-plan'} className={selectClass}><SelectValue /></SelectTrigger><SelectContent container={portal} alignItemWithTrigger={false}>{planOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
      <Button type="submit" className="min-h-11 px-5"><Search aria-hidden="true" />Filtrar</Button>
    </form>
    {!!plans.error && <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm"><p>Não foi possível carregar os planos.</p><Button variant="outline" onClick={() => setRetry(value => value + 1)}>Tentar novamente planos</Button></div>}
  </CardContent></Card></div>;
}
