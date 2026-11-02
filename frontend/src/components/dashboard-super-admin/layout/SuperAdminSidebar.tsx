import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Layers3, UserRound, Receipt } from 'lucide-react';

const items = [
  { to: '/super-admin', label: 'Visão geral', Icon: LayoutDashboard, end: true },
  { to: '/super-admin/companies', label: 'Empresas', Icon: Building2, end: true },
  { to: '/super-admin/companies/new', label: 'Cadastrar empresa', Icon: Building2 },
  { to: '/super-admin/plans', label: 'Planos', Icon: Layers3 },
  { to: '/super-admin/sales', label: 'Vendas', Icon: Receipt },
  { to: '/super-admin/settings/profile', label: 'Meu perfil', Icon: UserRound },
];
export function SuperAdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return <>
    <NavLink to="/super-admin" className="sa-brand" onClick={onNavigate} aria-label="Civix — início da administração">
      <span className="sa-brand-symbol" aria-hidden="true">c.</span><span>Civix<small>ADMINISTRAÇÃO</small></span>
    </NavLink>
    <p className="sa-nav-label">PLATAFORMA</p>
    <nav aria-label="Navegação administrativa"><ul className="sa-navigation">
      {items.map(({ to, label, Icon, end }) => <li key={to}>
        <NavLink to={to} end={end} onClick={onNavigate} className={({ isActive }) => isActive ? 'sa-nav-link is-active' : 'sa-nav-link'}>
          <Icon size={19} aria-hidden="true" /><span>{label}</span>
        </NavLink>
      </li>)}
    </ul></nav>
    <div className="sa-sidebar-footer"><span className="sa-status-dot" aria-hidden="true" />Gestão da plataforma<small>Ambiente administrativo Civix</small></div>
  </>;
}
