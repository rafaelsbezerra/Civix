import { ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { OverviewSalesMetrics } from '../../lib/api';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../ui/chart';
import { CountUpNumber } from './CountUpNumber';

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const chartConfig = {
  revenue: {
    label: 'Faturamento',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export function OverviewRevenueCharts({ metrics }: { metrics: OverviewSalesMetrics }) {
  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const now = new Date();
  const currentMonthIdx = now.getUTCMonth();
  const prevMonthDate = new Date(
    Date.UTC(now.getUTCFullYear(), currentMonthIdx - 1, 1),
  );
  const prevMonthIdx = prevMonthDate.getUTCMonth();

  const currentMonthLabel = monthNames[currentMonthIdx];
  const prevMonthLabel = monthNames[prevMonthIdx];

  const chartData = [
    {
      period: prevMonthLabel,
      revenue: metrics.previousMonthRevenue,
      count: metrics.previousMonthCount,
    },
    {
      period: currentMonthLabel,
      revenue: metrics.currentMonthRevenue,
      count: metrics.currentMonthCount,
    },
  ];

  const percent = metrics.monthOverMonthPercent;
  const isPositive = percent !== null && percent > 0;
  const isNegative = percent !== null && percent < 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Card 1: Receita Total Acumulada */}
      <Card className="rounded-2xl py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receita Total Acumulada
          </CardTitle>
          <DollarSign className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="space-y-1.5 px-5">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            <CountUpNumber value={metrics.totalRevenue} format="currency" />
          </p>
          <CardDescription className="text-xs">
            Volume total de <CountUpNumber value={metrics.totalSalesCount} />{' '}
            {metrics.totalSalesCount === 1 ? 'venda registrada' : 'vendas registradas'}
          </CardDescription>
        </CardContent>
      </Card>

      {/* Card 2: Faturamento no Mês Atual vs. Mês Anterior */}
      <Card className="rounded-2xl py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Mês Atual ({currentMonthLabel})
          </CardTitle>
          <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="space-y-2 px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              <CountUpNumber value={metrics.currentMonthRevenue} format="currency" />
            </p>
            {percent !== null ? (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                  isPositive
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : isNegative
                      ? 'border-destructive/30 bg-destructive/10 text-destructive'
                      : 'text-muted-foreground'
                }`}
              >
                {isPositive && <ArrowUpRight className="size-3" aria-hidden="true" />}
                {isNegative && <ArrowDownRight className="size-3" aria-hidden="true" />}
                {isPositive ? `+${percent}%` : `${percent}%`}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="rounded-full border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
              >
                Novo no mês
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Mês anterior ({prevMonthLabel}):{' '}
            <span className="font-medium text-foreground">
              {currency.format(metrics.previousMonthRevenue)}
            </span>{' '}
            ({metrics.previousMonthCount}{' '}
            {metrics.previousMonthCount === 1 ? 'venda' : 'vendas'})
          </CardDescription>
        </CardContent>
      </Card>

      {/* Card 3: Gráfico Comparativo Mês Anterior vs Mês Atual */}
      <Card className="rounded-2xl py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comparativo Mensal
            </CardTitle>
            <CardDescription className="text-xs">
              {prevMonthLabel} vs. {currentMonthLabel}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-5">
          <ChartContainer config={chartConfig} className="h-28 w-full">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs font-medium"
              />
              <YAxis hide domain={[0, 'auto']} />
              <ChartTooltip
                cursor={{ fill: 'currentColor', opacity: 0.05 }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-semibold tabular-nums text-foreground">
                        {currency.format(Number(value) || 0)}
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="revenue"
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
