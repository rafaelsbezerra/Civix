import { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

import { SiteHeader } from '@/components/layout/SiteHeader';
import Footer from '@/components/layout/SiteFooter';
import { fetchPlans } from '@/lib/api';
import type { Plan } from '@/lib/api';

function formatPrice(price: string) {
  return Number(price).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function billingLabel(period: Plan['billingPeriod']) {
  if (period === 'yearly') return 'por ano';
  if (period === 'one_time') return 'pagamento único';
  return 'por mês';
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchPlans()
      .then((availablePlans) => {
        if (mounted) setPlans(availablePlans);
      })
      .catch(() => {
        if (mounted) setError('Não foi possível carregar os planos agora.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
              Recursos e limites apresentados diretamente da configuração atual da plataforma.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24" aria-label="Planos disponíveis">
          {loading && (
            <div className="flex min-h-48 items-center justify-center text-[var(--color-civix-navy)]" role="status">
              <Loader2 className="mr-3 size-5 animate-spin" aria-hidden="true" />
              Carregando planos...
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center justify-center gap-3 border border-red-200 bg-red-50 p-6 text-center text-red-700" role="alert">
              <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          {!loading && !error && plans.length === 0 && (
            <div className="border border-black/10 bg-white p-10 text-center">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-civix-navy)]">Nenhum plano disponível</h2>
              <p className="mt-2 text-sm text-black/60">Consulte novamente mais tarde.</p>
            </div>
          )}

          {!loading && !error && plans.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  className={`relative flex flex-col border p-8 ${plan.isFeatured ? 'border-[var(--color-civix-gold)] bg-[var(--color-civix-navy)] text-[var(--color-civix-ivory)]' : 'border-black/10 bg-white text-[var(--color-civix-ink)]'}`}
                  key={plan.id}
                >
                  {plan.isFeatured && (
                    <span className="absolute right-6 top-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-civix-gold)]">Recomendado</span>
                  )}
                  <h2 className="pr-24 font-[family-name:var(--font-display)] text-2xl font-semibold">{plan.name}</h2>
                  <p className="mt-3 min-h-14 text-sm leading-6 opacity-70">{plan.description}</p>
                  <p className="mt-8 font-[family-name:var(--font-display)] text-4xl font-semibold">
                    <span className="mr-1 text-base font-normal opacity-70">R$</span>{formatPrice(plan.price)}
                    <span className="ml-2 text-sm font-normal opacity-60">{billingLabel(plan.billingPeriod)}</span>
                  </p>
                  <ul className="mt-8 space-y-3 border-t border-current/15 pt-6 text-sm">
                    {plan.features.map((feature) => (
                      <li className="flex gap-3" key={feature}>
                        <Check className="mt-0.5 size-4 shrink-0 text-[var(--color-civix-gold)]" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a className="mt-10 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-civix-gold)] px-5 font-[family-name:var(--font-display)] font-semibold text-white transition-colors hover:bg-[#b88320]" href="/login">
                    Começar agora
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
