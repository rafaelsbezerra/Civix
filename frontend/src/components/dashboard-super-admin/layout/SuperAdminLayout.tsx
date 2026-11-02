import { useRef, useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { X } from 'lucide-react';
import { ApiError, type SessionProfile } from '../../../lib/api';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminHeader } from './SuperAdminHeader';

export interface SuperAdminContext {
  session: SessionProfile;
  setProfile: (profile: SessionProfile['user']) => void;
  handleError: (error: unknown) => string;
}
const THEME_KEY = 'civix:super-admin:theme';
export function SuperAdminLayout() {
  const initialSession = useOutletContext<SessionProfile>();
  const [session, setSession] = useState(initialSession);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  });
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => { try { localStorage.setItem(THEME_KEY, theme); } catch { /* Preferência indisponível não bloqueia acesso. */ } }, [theme]);
  const logout = useCallback(() => { localStorage.removeItem('token'); navigate('/login/empresa', { replace: true }); }, [navigate]);
  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) logout();
    return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
  }, [logout]);
  const title = pathname.endsWith('/plans') ? 'Planos comerciais' : pathname.endsWith('/companies/new') ? 'Cadastrar empresa'
    : pathname.includes('/companies') ? 'Empresas' : pathname.includes('/sales') ? 'Vendas comerciais' : pathname.includes('/administrators') ? 'Superadmins' : pathname.endsWith('/settings/profile') ? 'Meu perfil' : 'Visão geral';
  return <div className={`super-admin-root${theme === 'dark' ? ' dark' : ''}`} data-theme={theme}>
    <a className="sa-skip-link" href="#admin-content">Pular para o conteúdo</a>
    <aside className="sa-sidebar"><SuperAdminSidebar /></aside>
    <dialog ref={dialog} className="sa-mobile-menu" aria-label="Menu de navegação">
      <button className="sa-icon-button sa-menu-close" onClick={() => dialog.current?.close()} aria-label="Fechar menu"><X size={22} /></button>
      <SuperAdminSidebar onNavigate={() => dialog.current?.close()} />
    </dialog>
    <div className="sa-workspace"><SuperAdminHeader title={title} name={session.user.name || 'Superadmin'} dark={theme === 'dark'}
      onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onOpenMenu={() => dialog.current?.showModal()} onLogout={logout} />
      <main id="admin-content" tabIndex={-1} className="sa-content"><Outlet context={{ session, setProfile: user => setSession({ ...session, user }), handleError } satisfies SuperAdminContext} /></main>
      <footer className="sa-footer">Civix · Administração da plataforma<span>Valores em BRL · Datas em UTC</span></footer>
    </div>
  </div>;
}
