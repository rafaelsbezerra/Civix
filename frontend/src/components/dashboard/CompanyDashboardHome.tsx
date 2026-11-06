import {
  ArrowDown,
  BadgeCheck,
  ChartNoAxesCombined,
  CircleAlert,
  Headset,
  MessageSquareText,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import { useOutletContext } from 'react-router-dom'

import type { SessionProfile } from '@/lib/api'

const mockMetrics = [
  {
    label: 'Novos leads',
    value: '316',
    trend: '+18,4%',
    detail: 'em relação ao mês anterior',
    icon: UserRound,
  },
  {
    label: 'Leads qualificados',
    value: '174',
    trend: '+12,8%',
    detail: 'no período demonstrativo',
    icon: BadgeCheck,
  },
  {
    label: 'Conversas ativas',
    value: '27',
    trend: '+8,2%',
    detail: 'no período demonstrativo',
    icon: MessageSquareText,
  },
  {
    label: 'Atendimentos',
    value: '63',
    trend: '+6,1%',
    detail: 'no período demonstrativo',
    icon: Headset,
  },
]

const chartMonths = ['Dez', 'Jan', 'Fev', 'Mar', 'Abr']
const leadCounts = [126, 158, 177, 229, 316]
const conversationCounts = [34, 46, 57, 72, 91]
const funnelItems = [
  { label: 'Novos leads', value: '316', width: '100%' },
  { label: 'Qualificados', value: '174', width: '72%' },
  { label: 'Em atendimento', value: '91', width: '48%' },
  { label: 'Convertidos', value: '63', width: '31%' },
]
const channels = [
  { label: 'WhatsApp', value: '58%', color: 'var(--dashboard-accent)' },
  { label: 'Site', value: '27%', color: 'var(--dashboard-chart-secondary)' },
  { label: 'Perfil da empresa', value: '15%', color: 'var(--dashboard-subtle)' },
]

function TrendChart() {
  return (
    <svg
      aria-label="Gráfico ilustrativo de novos leads e conversas entre dezembro e abril"
      className="mt-5 h-64 w-full overflow-visible"
      role="img"
      viewBox="0 0 640 260"
    >
      {[30, 80, 130, 180, 230].map((y) => (
        <line
          key={y}
          stroke="var(--dashboard-chart-grid)"
          strokeDasharray="3 5"
          strokeWidth="1"
          x1="20"
          x2="620"
          y1={y}
          y2={y}
        />
      ))}
      {conversationCounts.map((value, index) => {
        const x = 56 + index * 116
        const barHeight = (value / 100) * 174
        return (
          <rect
            fill="var(--dashboard-chart-secondary)"
            height={barHeight}
            key={`bar-${chartMonths[index]}`}
            rx="8"
            width="48"
            x={x + 24}
            y={230 - barHeight}
          />
        )
      })}
      <polyline
        fill="none"
        points={leadCounts
          .map((value, index) => `${56 + index * 116},${222 - value * 0.58}`)
          .join(' ')}
        stroke="var(--dashboard-accent)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      {leadCounts.map((value, index) => (
        <circle
          cx={56 + index * 116}
          cy={222 - value * 0.58}
          fill="var(--dashboard-accent)"
          key={`point-${chartMonths[index]}`}
          r="5"
        />
      ))}
      {chartMonths.map((month, index) => (
        <text
          fill="var(--dashboard-subtle)"
          fontSize="12"
          key={month}
          textAnchor="middle"
          x={56 + index * 116}
          y="253"
        >
          {month}
        </text>
      ))}
    </svg>
  )
}

function ChannelDonut() {
  return (
    <div className="dashboard-channel-donut mx-auto mt-5 flex size-52 items-center justify-center rounded-full">
      <div className="grid size-32 place-items-center rounded-full bg-[var(--dashboard-surface)] text-center">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--dashboard-text)]">
            3
          </p>
          <p className="text-xs text-[var(--dashboard-subtle)]">canais</p>
        </div>
      </div>
    </div>
  )
}

export function CompanyDashboardHome() {
  const { user } = useOutletContext<SessionProfile>()
  const displayName = user.name?.trim() || user.email

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">
      <header
        aria-labelledby="company-dashboard-title"
        className="relative isolate overflow-hidden rounded-2xl border border-[var(--dashboard-border)] bg-gradient-to-br from-[var(--dashboard-hero-from)] to-[var(--dashboard-hero-to)] px-6 py-7 text-[var(--dashboard-text)] sm:px-9 sm:py-9"
      >
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-32 -z-10 size-96 rounded-full border-[48px] border-[var(--dashboard-accent)]/[0.08]"
        />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--dashboard-accent-text)]">
              <span aria-hidden="true" className="size-2 rounded-full bg-[var(--dashboard-accent)]" />
              Visão geral
            </p>
            <h1
              className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--dashboard-text)] sm:text-4xl"
              id="company-dashboard-title"
            >
              Olá, {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--dashboard-muted)] sm:text-base">
              Acompanhe leads, conversas e o desempenho da sua operação em um só lugar.
            </p>
          </div>
          <a
            className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg bg-[var(--dashboard-accent)] px-4 py-2.5 text-sm font-bold text-[var(--dashboard-on-accent)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--dashboard-accent)] sm:self-auto"
            href="#dashboard-indicators"
          >
            Explorar indicadores
            <ArrowDown aria-hidden="true" className="size-4" />
          </a>
        </div>
      </header>

      <section aria-label="Indicadores demonstrativos" id="dashboard-indicators">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {mockMetrics.map(({ label, value, trend, detail, icon: Icon }) => (
            <article
              className="rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5"
              key={label}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="dashboard-muted-heading text-sm font-medium text-[var(--dashboard-muted)]">{label}</h2>
                <span className="grid size-9 place-items-center rounded-lg bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-text)]">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
              </div>
              <p className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--dashboard-text)]">
                {value}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--dashboard-positive-bg)] px-2.5 py-1 font-semibold text-[var(--dashboard-positive-text)]">
                  <TrendingUp aria-hidden="true" className="size-3" />
                  {trend}
                </span>
                <span className="text-[var(--dashboard-subtle)]">{detail}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section
          aria-labelledby="performance-chart-title"
          className="rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2
                className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dashboard-text)]"
                id="performance-chart-title"
              >
                Leads e conversas por mês
              </h2>
              <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">Dezembro — Abril · demonstração</p>
            </div>
            <ChartNoAxesCombined aria-hidden="true" className="size-5 text-[var(--dashboard-accent)]" />
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--dashboard-muted)]">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-full bg-[var(--dashboard-accent)]" />
              Leads
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-sm bg-[var(--dashboard-chart-secondary)]" />
              Conversas
            </span>
          </div>
          <TrendChart />
        </section>

        <section
          aria-labelledby="channels-chart-title"
          className="rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 sm:p-6"
        >
          <h2
            className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dashboard-text)]"
            id="channels-chart-title"
          >
            Origem dos contatos
          </h2>
          <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">Distribuição ilustrativa por canal</p>
          <ChannelDonut />
          <ul aria-label="Canais demonstrativos" className="mt-5 space-y-2.5">
            {channels.map(({ label, value, color }) => (
              <li
                className="flex items-center justify-between rounded-lg border border-[var(--dashboard-border)] px-3.5 py-3 text-sm"
                key={label}
              >
                <span className="inline-flex items-center gap-2.5 text-[var(--dashboard-text)]">
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
                <span className="font-semibold text-[var(--dashboard-accent-text)]">{value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section
          aria-labelledby="funnel-title"
          className="rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 sm:p-6"
        >
          <h2
            className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dashboard-text)]"
            id="funnel-title"
          >
            Funil comercial
          </h2>
          <p className="mt-1 text-xs text-[var(--dashboard-subtle)]">Etapas ilustrativas de acompanhamento</p>
          <ol className="mt-5 space-y-4">
            {funnelItems.map(({ label, value, width }) => (
              <li key={label}>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="text-[var(--dashboard-text)]">{label}</span>
                  <span className="text-[var(--dashboard-muted)]">{value} registros</span>
                </div>
                <div
                  aria-label={`${label}: ${value} registros, valor demonstrativo`}
                  className="h-2 overflow-hidden rounded-full bg-[var(--dashboard-border)]"
                  role="img"
                >
                  <span
                    className="block h-full rounded-full bg-[var(--dashboard-accent)]"
                    style={{ width }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="recent-activity-title"
          className="rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--dashboard-accent)]" />
            <div>
              <h2
                className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dashboard-text)]"
                id="recent-activity-title"
              >
                Atividade recente
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--dashboard-muted)]">
                O histórico de leads e atendimentos será exibido aqui quando
                essas informações estiverem disponíveis no sistema.
              </p>
              <p className="mt-3 text-xs text-[var(--dashboard-subtle)]">
                Ainda não há uma fonte de atividade integrada; nenhum evento
                fictício é mostrado.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
