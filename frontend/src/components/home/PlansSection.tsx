import { AlertCircle, Loader2 } from 'lucide-react';

import { PlanCard } from '@/components/plans/PlanCard';
import { usePlans } from '@/components/plans/usePlans';

export function PlansSection() {
  const { plans, loading, error } = usePlans();

  return (
    <section
      aria-labelledby="plans-section-title"
      className="px-4 py-16 sm:px-8 lg:px-16 lg:py-24"
      id="planos"
    >
      <div className="mx-auto max-w-[1200px]">
        <div data-motion="section" className="mb-10 max-w-2xl">
          <p className="font-[family-name:var(--font-display)] text-base font-medium leading-[normal] text-[var(--color-civix-navy)]">
            <span className="text-[var(--color-civix-gold-accessible)]">//</span>{' '}
            <span>Planos Civix</span>
          </p>
          <h2
            className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.25rem,7vw,3rem)] font-normal leading-[1.1] tracking-normal text-[var(--color-civix-navy)] 2xl:text-[48px]"
            id="plans-section-title"
          >
            O plano certo para cada etapa do seu crescimento
          </h2>
          <p className="mt-4 max-w-[557px] font-[family-name:var(--font-body)] text-base font-normal leading-[normal] text-[rgba(7,25,42,0.8)]">
            Compare os recursos e escolha como sua empresa quer crescer com a Civix.
          </p>
        </div>

        {loading && (
          <div
            className="flex min-h-48 items-center justify-center text-[var(--color-civix-navy)]"
            role="status"
          >
            <Loader2
              aria-hidden="true"
              className="mr-3 size-5 animate-spin motion-reduce:animate-none"
            />
            Carregando planos...
          </div>
        )}

        {error && !loading && (
          <div
            className="flex items-center justify-center gap-3 border border-red-200 bg-red-50 p-6 text-center text-red-700"
            role="alert"
            data-motion="feedback"
            data-motion-trigger="mount"
          >
            <AlertCircle aria-hidden="true" className="size-5 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && plans.length === 0 && (
          <p
            role="status"
            data-motion="feedback"
            data-motion-trigger="mount"
            className="border border-black/10 bg-white p-8 text-center text-black/60"
          >
            Nenhum plano disponível no momento.
          </p>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.slice(0, 3).map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}

        <div data-motion="section" className="mt-10 text-center">
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-civix-navy)] px-6 font-[family-name:var(--font-display)] font-semibold text-[var(--color-civix-navy)] transition-colors hover:bg-[var(--color-civix-navy)] hover:text-[var(--color-civix-ivory)] focus-visible:outline-offset-4"
            href="/planos"
          >
            Ver todos os planos
          </a>
        </div>
      </div>
    </section>
  );
}
