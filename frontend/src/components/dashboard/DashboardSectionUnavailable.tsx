import {
  AlertCircle,
  Building2,
  ClipboardList,
  LayoutDashboard,
  MessageSquareText,
  UserRound,
  UserRoundCog,
  Users,
} from 'lucide-react';

interface DashboardSectionUnavailableProps {
  title: string;
  description: string;
  reason: string;
  icon: 'home' | 'leads' | 'conversations' | 'history' | 'profile' | 'team' | 'company';
}

const sectionIcons = {
  home: LayoutDashboard,
  leads: UserRound,
  conversations: MessageSquareText,
  history: ClipboardList,
  profile: UserRoundCog,
  team: Users,
  company: Building2,
};

export function DashboardSectionUnavailable({
  title,
  description,
  reason,
  icon,
}: DashboardSectionUnavailableProps) {
  const Icon = sectionIcons[icon];

  return (
    <div className="mx-auto max-w-7xl">
      <header className="border-b border-[var(--dashboard-border)] pb-6 sm:pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--dashboard-accent-text)]">
          Painel da empresa
        </p>
        <h1
          className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--dashboard-text)] sm:text-4xl"
          id="dashboard-section-title"
        >
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--dashboard-muted)] sm:text-base">
          {description}
        </p>
      </header>

      <section
        aria-labelledby="dashboard-section-state-title"
        className="mt-8 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-6 sm:mt-10 sm:p-8"
      >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-start">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-text)]">
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--dashboard-warning-border)] bg-[var(--dashboard-warning-bg)] px-3 py-1 text-xs font-semibold text-[var(--dashboard-warning-text)]">
              <AlertCircle aria-hidden="true" className="size-3.5" />
              Indisponível
            </p>
            <h2
              className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--dashboard-text)] sm:text-2xl"
              id="dashboard-section-state-title"
            >
              Esta área ainda não está conectada
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--dashboard-muted)]">
              {reason}
            </p>
            <p className="mt-4 text-xs leading-5 text-[var(--dashboard-subtle)]">
              Nenhum dado foi carregado ou criado nesta tela. Quando a integração
              estiver pronta, esta área mostrará dados da empresa confirmados pelo
              servidor.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
