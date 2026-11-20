import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Moon,
  Sun,
  Users,
  UserRound,
  UserRoundCog,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useOutletContext } from 'react-router-dom';

import logoCivix from '@/assets/civix/logo-civix-white.png';
import type { SessionProfile } from '@/lib/api';

interface DashboardNavigationItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  ownerOnly?: boolean;
}

const ownerNavigationItems: DashboardNavigationItem[] = [
  { to: '/dashboard-empresa', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/dashboard-empresa/leads', label: 'Leads', icon: UserRound },
  {
    to: '/dashboard-empresa/conversas',
    label: 'Conversas',
    icon: MessageSquareText,
  },
  {
    to: '/dashboard-empresa/equipe',
    label: 'Equipe',
    icon: Users,
    ownerOnly: true,
  },
  {
    to: '/dashboard-empresa/configuracoes',
    label: 'Empresa',
    icon: Building2,
    ownerOnly: true,
  },
];

const attendantNavigationItems: DashboardNavigationItem[] = [
  { to: '/dashboard-atendente', label: 'Início', icon: LayoutDashboard },
  { to: '/dashboard-atendente/conversas', label: 'Conversas', icon: MessageSquareText },
  { to: '/dashboard-atendente/historico', label: 'Histórico', icon: ClipboardList },
  { to: '/dashboard-atendente/perfil', label: 'Perfil', icon: UserRoundCog },
];

export function CompanyDashboardLayout() {
  const session = useOutletContext<SessionProfile>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isOwner = session.user.role === 'admin_empresa';
  const navigationItems = isOwner ? ownerNavigationItems : attendantNavigationItems;
  const visibleItems = navigationItems.filter((item) => !item.ownerOnly || isOwner);
  const displayName = session.user.name?.trim() || session.user.email;

  function renderNavigation(mobile = false) {
    return (
      <nav aria-label={mobile ? 'Navegação do painel' : 'Navegação principal'}>
        <ul className={mobile ? 'space-y-1' : 'flex items-center gap-1'}>
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dashboard-accent)] ${
                    isActive
                      ? 'bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-sidebar-text)]'
                      : 'text-[var(--dashboard-sidebar-muted)] hover:bg-white/[0.08] hover:text-[var(--dashboard-sidebar-text)]'
                  }`
                }
                end={to === '/dashboard-empresa'}
                onClick={() => setIsMobileMenuOpen(false)}
                to={to}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div
      className="company-dashboard-shell min-h-screen bg-[var(--dashboard-bg)] text-[var(--dashboard-text)]"
      data-theme={theme}
    >
      <header className="sticky top-0 z-30 border-b border-[var(--dashboard-border)] bg-[var(--dashboard-bg)]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-11 max-w-[1920px] items-center gap-4">
          <Link
            aria-label="Civix — início"
            className="inline-flex shrink-0 items-center"
            to="/"
          >
            <img
              alt="Civix"
              className="h-8 w-[99px] object-contain"
              height="32"
              src={logoCivix}
              width="99"
            />
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {renderNavigation()}
            </div>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] py-1 pl-1 pr-3">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--dashboard-accent-soft)] text-xs font-bold text-[var(--dashboard-accent-text)]"
              >
                {initials}
              </span>
              <p className="max-w-36 truncate text-sm text-[var(--dashboard-text)]">
                {displayName}
              </p>
            </div>

            <button
              aria-label={`Ativar tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
              className="grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--dashboard-border)] text-[var(--dashboard-accent)] transition-colors hover:bg-[var(--dashboard-accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dashboard-accent)]"
              onClick={() =>
                setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
              }
              type="button"
            >
              {theme === 'dark' ? (
                <Sun aria-hidden="true" className="size-5" />
              ) : (
                <Moon aria-hidden="true" className="size-5" />
              )}
            </button>

            <button
              aria-controls="company-dashboard-mobile-navigation"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Fechar navegação' : 'Abrir navegação'}
              className="grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--dashboard-border)] text-[var(--dashboard-text)] lg:hidden"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              type="button"
            >
              {isMobileMenuOpen ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        </div>

        <div
          className={`mx-auto max-w-[1920px] pt-3 lg:hidden ${isMobileMenuOpen ? '' : 'hidden'}`}
          id="company-dashboard-mobile-navigation"
        >
          <div className="rounded-xl bg-[var(--dashboard-sidebar)] p-3">
            {renderNavigation(true)}
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet context={session} />
      </main>
    </div>
  );
}

export function OwnerDashboardRoute() {
  const session = useOutletContext<SessionProfile>();

  if (session.user.role !== 'admin_empresa') {
    return <Navigate replace to="/dashboard-empresa" />;
  }

  return <Outlet context={session} />;
}
