import { Menu, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';
export function SuperAdminHeader({ title, name, dark, onToggleTheme, onOpenMenu, onLogout }:
  { title: string; name: string; dark: boolean; onToggleTheme: () => void; onOpenMenu: () => void; onLogout: () => void }) {
  return <header className="sa-header">
    <div className="sa-header-title"><button className="sa-icon-button sa-menu-button" onClick={onOpenMenu} aria-label="Abrir menu de navegação"><Menu size={21} /></button>
      <div><span className="sa-eyebrow">ÁREA DO SUPERADMIN</span><p>{title}</p></div></div>
    <div className="sa-header-actions"><ThemeToggle dark={dark} onToggle={onToggleTheme} />
      <Link className="sa-account" to="/super-admin/settings/profile"><span className="sa-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span><span>{name}<small>Superadmin</small></span></Link>
      <button className="sa-icon-button" onClick={onLogout} aria-label="Sair da conta"><LogOut size={19} /></button>
    </div>
  </header>;
}
