import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Layers3, UserRound, Receipt, MessageCircle } from 'lucide-react';
import logoCivix from '@/assets/civix/logo-civix.png';
import logoCivixWhite from '@/assets/civix/logo-civix-white.png';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { to: '/super-admin', label: 'Visão geral', Icon: LayoutDashboard, end: true },
  { to: '/super-admin/companies', label: 'Empresas', Icon: Building2, end: true },
  { to: '/super-admin/companies/new', label: 'Cadastrar empresa', Icon: Building2 },
  { to: '/super-admin/plans', label: 'Planos', Icon: Layers3 },
  { to: '/super-admin/sales', label: 'Vendas', Icon: Receipt },
  { to: '/super-admin/administrators', label: 'Superadmins', Icon: UserRound },
  { to: '/super-admin/settings/profile', label: 'Meu perfil', Icon: UserRound },
];

export function SuperAdminSidebar() {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile, state } = useSidebar();
  return <Sidebar variant="inset" collapsible="icon">
    <SidebarHeader className="p-3">
      <SidebarMenu><SidebarMenuItem>
        <SidebarMenuButton size="lg" className="h-12 rounded-xl p-2" tooltip="Início da administração"
          render={<NavLink to="/super-admin" aria-label="Civix — início da administração" onClick={() => setOpenMobile(false)} />}>
          {state === 'collapsed' && !isMobile ? <img src="/icon.svg" alt="" className="size-8 shrink-0 object-contain" /> : <>
            <img src={logoCivix} alt="Civix" className="sa-brand-logo sa-brand-logo-light" />
            <img src={logoCivixWhite} alt="Civix" className="sa-brand-logo sa-brand-logo-dark" />
          </>}
        </SidebarMenuButton>
      </SidebarMenuItem></SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <nav aria-label="Navegação administrativa"><SidebarGroup>
        <SidebarGroupLabel className="px-3 text-[10px] font-semibold tracking-[0.16em]">PLATAFORMA</SidebarGroupLabel>
        <SidebarGroupContent><SidebarMenu className="gap-1">
          {items.map(({ to, label, Icon, end }) => {
            const isActive = end ? pathname === to : pathname.startsWith(to);
            return <SidebarMenuItem key={to}>
              <SidebarMenuButton isActive={isActive} tooltip={label}
                className="h-10 rounded-xl px-3 text-[13px] hover:bg-white/50 dark:hover:bg-white/10 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground"
                render={<NavLink to={to} end={end} onClick={() => setOpenMobile(false)} />}>
                <Icon aria-hidden="true" /><span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>;
          })}
        </SidebarMenu></SidebarGroupContent>
      </SidebarGroup></nav>
    </SidebarContent>
    <SidebarFooter className="p-3">
      <a href="https://web.whatsapp.com/" target="_blank" rel="noreferrer"
        className="block rounded-xl border border-sidebar-border bg-background/70 p-3 text-xs transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden">
        <span className="flex items-center gap-2 font-medium"><MessageCircle className="size-4 text-[var(--sa-accent-ink)]" aria-hidden="true" />Possui alguma dúvida?</span>
        <span className="mt-1.5 block text-[11px] leading-4 text-muted-foreground">Entre em contato pelo WhatsApp</span>
      </a>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>;
}
