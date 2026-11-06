import { Calendar, DollarSign, Layers3 } from 'lucide-react';
import type { Plan, PlatformSale } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { CountUpNumber } from './CountUpNumber';

export function SalesMetricsCards({
  sales,
  plans,
}: {
  sales: PlatformSale[];
  plans: Plan[];
}) {
  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const number = new Intl.NumberFormat('pt-BR');

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const monthlySales = sales.filter(sale => {
    const soldDate = new Date(sale.soldAt);
    return (
      soldDate.getUTCFullYear() === currentYear && soldDate.getUTCMonth() === currentMonth
    );
  });
  const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const monthlyShare =
    totalRevenue > 0 ? Math.min(100, Math.round((monthlyRevenue / totalRevenue) * 100)) : 0;

  const planTotals = new Map<string, { id: string; name: string; revenue: number }>();
  for (const plan of plans) {
    if (!/\bplano\b/i.test(plan.name)) {
      planTotals.set(String(plan.id), { id: String(plan.id), name: plan.name, revenue: 0 });
    }
  }
  for (const sale of sales) {
    const key = sale.planId ? String(sale.planId) : '__manual__';
    const existing = planTotals.get(key);
    if (existing) {
      existing.revenue += Number(sale.amount || 0);
    } else {
      const label = sale.planName || 'Avulso / Manual';
      if (!/\bplano\b/i.test(label)) {
        planTotals.set(key, {
          id: key,
          name: label,
          revenue: Number(sale.amount || 0),
        });
      }
    }
  }

  const byPlan = [...planTotals.values()];
  const maxPlanRevenue = Math.max(1, ...byPlan.map(item => item.revenue));

  return (
    <section
      aria-label="Métricas de vendas"
      className="grid auto-rows-fr items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <Card className="gap-3 rounded-2xl py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Faturamento total
          </CardTitle>
          <DollarSign className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="px-4">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            <CountUpNumber value={totalRevenue} format="currency" />
          </p>
          <CardDescription className="mt-1 text-xs">
            Soma de todas as vendas (<CountUpNumber value={sales.length} />)
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="gap-3 rounded-2xl py-4" role="region" aria-label="Faturamento no mês">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Faturamento no mês
          </CardTitle>
          <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              <CountUpNumber value={monthlyRevenue} format="currency" />
            </p>
            <span className="pb-1 text-xs font-medium text-muted-foreground">
              <CountUpNumber value={monthlyShare} suffix="% do total" />
            </span>
          </div>
          <div
            role="meter"
            aria-label="Percentual do faturamento no mês"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={monthlyShare}
            aria-valuetext={number.format(monthlyShare) + '% do total'}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: monthlyShare + '%' }}
            />
          </div>
          <CardDescription className="mt-2 text-xs">
            <CountUpNumber value={monthlySales.length} suffix=" vendas no mês atual (UTC)" />
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="gap-3 rounded-2xl py-4" role="region" aria-label="Faturamento por plano">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Faturamento por plano
          </CardTitle>
          <Layers3 className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="px-4">
          {!byPlan.length ? (
            <p className="text-sm text-muted-foreground">Nenhum plano para exibir.</p>
          ) : (
            <ul className="space-y-2">
              {byPlan.map(item => (
                <li
                  key={item.id}
                  className="grid grid-cols-[minmax(0,96px)_minmax(0,1fr)_auto] items-center gap-2 text-xs"
                >
                  <span className="min-w-0 break-words">{item.name}</span>
                  <div
                    role="meter"
                    aria-label={'Faturamento em ' + item.name}
                    aria-valuemin={0}
                    aria-valuemax={maxPlanRevenue}
                    aria-valuenow={item.revenue}
                    aria-valuetext={currency.format(item.revenue)}
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: (item.revenue / maxPlanRevenue) * 100 + '%' }}
                    />
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">
                    <CountUpNumber value={item.revenue} format="currency" />
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

