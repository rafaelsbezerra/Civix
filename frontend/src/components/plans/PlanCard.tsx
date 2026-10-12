import { Check } from 'lucide-react'

import type { Plan } from '@/lib/api'

interface PlanCardProps {
  plan: Plan
}

const billingLabels: Record<Plan['billingPeriod'], string> = {
  monthly: 'por mês',
  yearly: 'por ano',
  one_time: 'pagamento único',
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function PlanCard({ plan }: PlanCardProps) {
  const isFeatured = plan.isFeatured

  return (
    <article
      data-motion="item"
      data-motion-step="60"
      aria-labelledby={`plan-${plan.id}-title`}
      className={`relative flex h-full flex-col rounded-2xl border p-6 sm:p-8 ${
        isFeatured
          ? 'border-[var(--color-civix-gold)] bg-[var(--color-civix-navy)] text-[var(--color-civix-ivory)]'
          : 'border-black/10 bg-white text-[var(--color-civix-ink)]'
      }`}
    >
      {isFeatured && (
        <span className="absolute right-6 top-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-civix-gold)]">
          Recomendado
        </span>
      )}
      <h2
        className={`font-[family-name:var(--font-display)] text-2xl font-semibold ${isFeatured ? 'pr-28 !text-[var(--color-civix-ivory)]' : ''}`}
        id={`plan-${plan.id}-title`}
      >
        {plan.name}
      </h2>
      <p className="mt-3 min-h-14 text-sm leading-6 opacity-70">{plan.description}</p>
      <p className="mt-8 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
        <span className="mr-1 text-base font-normal opacity-70">R$</span>
        {currencyFormatter.format(Number(plan.price))}
        <span className="ml-2 text-sm font-normal opacity-60">
          {billingLabels[plan.billingPeriod]}
        </span>
      </p>
      <ul className="mt-8 space-y-3 border-t border-current/15 pt-6 text-sm">
        {plan.features.map((feature) => (
          <li className="flex gap-3" key={feature}>
            <Check
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-[var(--color-civix-gold)]"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <a
        aria-label={`Começar agora com ${plan.name}`}
        className="mt-10 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-civix-gold)] px-5 font-[family-name:var(--font-display)] font-semibold text-white transition-colors hover:bg-[#b88320] focus-visible:outline-offset-4"
        href="/login"
      >
        Começar agora
      </a>
    </article>
  )
}
