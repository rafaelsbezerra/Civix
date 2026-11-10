import { Building2, Users2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import type { ManagedUsersMetrics, OverviewCompaniesMetrics } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../ui/chart';
import { CountUpNumber } from './CountUpNumber';

const companiesChartConfig = {
  active: {
    label: 'Ativas',
    color: 'var(--primary)',
  },
  inactive: {
    label: 'Inativas / Suspensas',
    color: '#f59e0b',
  },
  archived: {
    label: 'Arquivadas',
    color: '#94a3b8',
  },
} satisfies ChartConfig;

const usersChartConfig = {
  active: {
    label: 'Ativos',
    color: 'var(--primary)',
  },
  pending: {
    label: 'Aguardando senha',
    color: '#eab308',
  },
  blocked: {
    label: 'Desativados',
    color: '#ef4444',
  },
} satisfies ChartConfig;

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Superadmins',
  admin_empresa: 'Admins Empresa',
  atendente: 'Atendentes',
};

export function OverviewHealthAndUsersCharts({
  companiesMetrics,
  usersMetrics,
}: {
  companiesMetrics: OverviewCompaniesMetrics;
  usersMetrics: ManagedUsersMetrics;
}) {
  const activePercent = companiesMetrics.total
    ? Math.round((companiesMetrics.active / companiesMetrics.total) * 100)
    : 0;

  const companiesPieData = [
    {
      name: 'Ativas',
      value: companiesMetrics.active,
      color: companiesChartConfig.active.color,
    },
    {
      name: 'Inativas / Suspensas',
      value: companiesMetrics.inactive,
      color: companiesChartConfig.inactive.color,
    },
    {
      name: 'Arquivadas',
      value: companiesMetrics.archived,
      color: companiesChartConfig.archived.color,
    },
  ].filter((item) => item.value > 0);

  const usersBarData = usersMetrics.byRole.map((roleItem) => ({
    role: ROLE_LABELS[roleItem.role] || roleItem.role,
    active: roleItem.active,
    pending: roleItem.pending,
    blocked: roleItem.blocked,
    total: roleItem.total,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Bloco 1: Saúde da Base de Empresas */}
      <Card className="rounded-2xl py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 pb-3">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saúde da Base de Empresas
            </CardTitle>
            <CardDescription className="text-xs">
              Status operacional de toda a base cadastrada
            </CardDescription>
          </div>
          <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="px-5">
          <div className="grid items-center gap-4 sm:grid-cols-[1.2fr_auto]">
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  <CountUpNumber value={companiesMetrics.total} />
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  empresas no total
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="size-2 rounded-full bg-primary" />
                    Ativas
                  </span>
                  <span className="font-semibold tabular-nums">
                    <CountUpNumber value={companiesMetrics.active} /> ({activePercent}%)
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Inativas / Suspensas
                  </span>
                  <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                    <CountUpNumber value={companiesMetrics.inactive} />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span className="size-2 rounded-full bg-slate-400" />
                    Arquivadas
                  </span>
                  <span className="font-semibold tabular-nums text-muted-foreground">
                    <CountUpNumber value={companiesMetrics.archived} />
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <ChartContainer config={companiesChartConfig} className="size-32">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={companiesPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={34}
                    outerRadius={52}
                    paddingAngle={3}
                  >
                    {companiesPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloco 2: Total de Usuários Gerenciados por Perfil */}
      <Card className="rounded-2xl py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 pb-3">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Gerenciados por Perfil
            </CardTitle>
            <CardDescription className="text-xs">
              Contas de equipe e administradores da plataforma
            </CardDescription>
          </div>
          <Users2 className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent className="px-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                <CountUpNumber value={usersMetrics.total} />
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                usuários no total
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{usersMetrics.active}</strong>{' '}
                ativos
              </span>
              <span>·</span>
              <span>
                <strong className="text-amber-600 dark:text-amber-400">
                  {usersMetrics.pending}
                </strong>{' '}
                aguardando
              </span>
              <span>·</span>
              <span>
                <strong className="text-destructive">{usersMetrics.blocked}</strong>{' '}
                desativados
              </span>
            </div>
          </div>

          <ChartContainer config={usersChartConfig} className="h-32 w-full">
            <BarChart
              data={usersBarData}
              margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="role"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                className="text-xs"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                className="text-xs tabular-nums"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex items-center gap-1.5 font-medium tabular-nums">
                        <span>{String(name)}:</span>
                        <span className="font-semibold">{String(value)}</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="active"
                stackId="a"
                fill="var(--primary)"
                radius={[0, 0, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="pending"
                stackId="a"
                fill="#eab308"
                radius={[0, 0, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="blocked"
                stackId="a"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
