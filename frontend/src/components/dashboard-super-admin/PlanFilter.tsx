import { useCallback, useEffect, useState } from 'react';
import { getPlatformPlans, type Plan } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function PlanFilter({
  onError,
  value,
  onValueChange,
  portalContainer,
  onPlansLoaded,
  onLoadingChange,
}: {
  onError: (error: unknown) => string;
  value?: string;
  onValueChange?: (value: string) => void;
  portalContainer?: HTMLElement | null;
  onPlansLoaded?: (plans: Plan[]) => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [retry, setRetry] = useState(0);
  const [internalValue, setInternalValue] = useState('');
  const [localPortal, setLocalPortal] = useState<HTMLDivElement | null>(null);

  const selected = value !== undefined ? value : internalValue;
  const handleSelect = (next: string | null) => {
    const normalized = !next || next === '__all__' ? '' : next;
    setInternalValue(normalized);
    onValueChange?.(normalized);
  };

  const load = useCallback(
    () =>
      getPlatformPlans().catch(error => {
        throw new Error(onError(error), { cause: error });
      }),
    [onError],
  );

  const query = useAsyncQuery('plan-filter:' + retry, load);

  useEffect(() => {
    onLoadingChange?.(query.loading);
  }, [query.loading, onLoadingChange]);

  useEffect(() => {
    if (query.data) {
      onPlansLoaded?.(query.data);
    }
  }, [query.data, onPlansLoaded]);
  const selectedPlan = query.data?.find(plan => plan.id === selected);
  const label = query.loading
    ? 'Carregando planos…'
    : selectedPlan
      ? `${selectedPlan.name}${selectedPlan.isActive ? '' : ' (inativo)'}`
      : 'Todos os planos';

  return (
    <div ref={setLocalPortal}>
      <Field>
        <FieldLabel htmlFor="sales-plan-filter">Plano</FieldLabel>
        <input type="hidden" name="planId" value={selected} />
        <Select
          value={selected || '__all__'}
          onValueChange={handleSelect}
          disabled={query.loading || !!query.error}
        >
          <SelectTrigger
            id="sales-plan-filter"
            aria-label="Plano"
            className="h-10 w-full bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50"
          >
            <SelectValue>{label}</SelectValue>
          </SelectTrigger>
          <SelectContent
            container={portalContainer !== undefined ? portalContainer : localPortal}
            alignItemWithTrigger={false}
          >
            <SelectItem value="__all__">
              {query.loading ? 'Carregando planos…' : 'Todos os planos'}
            </SelectItem>
            {query.data?.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
                {plan.isActive ? '' : ' (inativo)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!!query.error && (
          <div role="alert" className="mt-1 flex items-center gap-2 text-xs text-destructive">
            <span>Não foi possível carregar os planos.</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setRetry(current => current + 1)}
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </Field>
    </div>
  );
}
