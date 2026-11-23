import { Building2, CircleCheckBig, Layers3 } from 'lucide-react';
import type { CompanyMetrics } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { CountUpNumber } from './CountUpNumber';

export function CompanyMetricsCards({ metrics }: { metrics: CompanyMetrics }) {
  const visiblePlans = metrics.byPlan.filter(
    (plan) => !/\bplano\b/i.test(plan.planName),
  );
  const maximum = Math.max(1, ...visiblePlans.map((plan) => plan.count));
  const number = new Intl.NumberFormat('pt-BR');
  const activePercentage = metrics.total
    ? Math.round((metrics.active / metrics.total) * 100)
    : 0;
  return (
    <section
      aria-label="Métricas de empresas"
      className="grid auto-rows-fr items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <Card className="gap-3 rounded-2xl py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de empresas
          </CardTitle>
          <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="px-4">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            <CountUpNumber value={metrics.total} />
          </p>
          <CardDescription className="mt-1 text-xs">
            Toda a base cadastrada
          </CardDescription>
        </CardContent>
      </Card>

      <Card
        className="gap-3 rounded-2xl py-4"
        role="region"
        aria-label="Situação das empresas"
      >
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Empresas ativas
          </CardTitle>
          <CircleCheckBig className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              <CountUpNumber value={metrics.active} />
            </p>
            <span className="pb-1 text-xs font-medium text-muted-foreground">
              <CountUpNumber value={activePercentage} suffix="% da base" />
            </span>
          </div>
          <div
            role="meter"
            aria-label="Percentual de empresas ativas"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={activePercentage}
            aria-valuetext={number.format(activePercentage) + '% da base'}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: activePercentage + '%' }}
            />
          </div>
          <CardDescription className="mt-2 text-xs">
            <CountUpNumber value={metrics.inactive} suffix=" inativas" /> ·{' '}
            <CountUpNumber value={metrics.archived} suffix=" arquivadas" />
          </CardDescription>
        </CardContent>
      </Card>

      <Card
        className="gap-3 rounded-2xl py-4"
        role="region"
        aria-label="Empresas por plano"
      >
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Empresas por plano
          </CardTitle>
          <Layers3 className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="px-4">
          {!visiblePlans.length ? (
            <p className="text-sm text-muted-foreground">Nenhum plano para exibir.</p>
          ) : (
            <ul className="space-y-2">
              {visiblePlans.map((plan) => (
                <li
                  key={plan.planId ?? 'without-plan'}
                  className="grid grid-cols-[minmax(0,96px)_minmax(0,1fr)_auto] items-center gap-2 text-xs"
                >
                  <span className="min-w-0 break-words">{plan.planName}</span>
                  <div
                    role="meter"
                    aria-label={'Empresas em ' + plan.planName}
                    aria-valuemin={0}
                    aria-valuemax={maximum}
                    aria-valuenow={plan.count}
                    aria-valuetext={number.format(plan.count) + ' empresas'}
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: (plan.count / maximum) * 100 + '%' }}
                    />
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">
                    <CountUpNumber value={plan.count} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
