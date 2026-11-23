import { AlertCircle, Loader2 } from 'lucide-react';

import { SiteHeader } from '@/components/layout/SiteHeader';
import Footer from '@/components/layout/SiteFooter';
import { PlanCard } from '@/components/plans/PlanCard';
import { usePlans } from '@/components/plans/usePlans';

export default function Plans() {
  const { plans, loading, error } = usePlans();

  return (
    <div className="min-h-screen bg-[var(--color-civix-ivory)] font-[family-name:var(--font-body)] text-[var(--color-civix-ink)]">
      <SiteHeader />
      <main>
        <section className="bg-[var(--color-civix-navy)] px-6 pb-20 pt-16 text-[var(--color-civix-ivory)] sm:px-10 lg:px-16 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-[1200px]">
            <p className="mb-4 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.24em] text-[var(--color-civix-gold)]">
              Planos Civix
            </p>
            <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-5xl font-semibold leading-[0.98] sm:text-6xl">
              Escolha o espaço certo para sua empresa crescer.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--color-civix-ivory)]/75">
              Recursos e limites apresentados diretamente da configuração atual da
              plataforma.
            </p>
          </div>
        </section>

        <section
          aria-label="Planos disponíveis"
          className="mx-auto max-w-[1200px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24"
        >
          {loading && (
            <div
              className="flex min-h-48 items-center justify-center text-[var(--color-civix-navy)]"
              role="status"
            >
              <Loader2 aria-hidden="true" className="mr-3 size-5 animate-spin" />
              Carregando planos...
            </div>
          )}

          {error && !loading && (
            <div
              className="flex items-center justify-center gap-3 border border-red-200 bg-red-50 p-6 text-center text-red-700"
              role="alert"
            >
              <AlertCircle aria-hidden="true" className="size-5 shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && plans.length === 0 && (
            <div className="border border-black/10 bg-white p-10 text-center">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-civix-navy)]">
                Nenhum plano disponível
              </h2>
              <p className="mt-2 text-sm text-black/60">
                Consulte novamente mais tarde.
              </p>
            </div>
          )}

          {!loading && !error && plans.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
