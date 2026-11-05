import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { ApiError, logout as apiLogout, type SessionProfile } from '../../../lib/api';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
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

  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => { try { localStorage.setItem(THEME_KEY, theme); } catch { /* Preferência indisponível não bloqueia acesso. */ } }, [theme]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Se a chamada falhar, a saída local ainda será concluída.
    } finally {
      navigate('/dashboard/super-admin/login', { replace: true });
    }
  }, [navigate]);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) void logout();
    return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
  }, [logout]);

  const title = pathname.endsWith('/plans') ? 'Planos comerciais' : pathname.endsWith('/companies/new') ? 'Cadastrar empresa'
    : pathname.includes('/companies') ? 'Empresas' : pathname.includes('/sales') ? 'Vendas comerciais' : pathname.includes('/administrators') ? 'Superadmins' : pathname.endsWith('/settings/profile') ? 'Meu perfil' : 'Visão geral';
  const sidebarVariables = { '--sidebar-width': '17rem', '--header-height': '4rem' } as CSSProperties;

  return <div className={`super-admin-root${theme === 'dark' ? ' dark' : ''}`} data-theme={theme}>
    <a className="sa-skip-link" href="#admin-content">Pular para o conteúdo</a>
    <TooltipProvider>
      <SidebarProvider style={sidebarVariables}>
        <SuperAdminSidebar />
        <SidebarInset id="admin-content" tabIndex={-1} className="min-w-0 md:border md:border-border/70">
          <SuperAdminHeader title={title} name={session.user.name || 'Superadmin'} dark={theme === 'dark'}
            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onLogout={logout} />
          <div className="sa-content"><Outlet context={{ session, setProfile: user => setSession({ ...session, user }), handleError } satisfies SuperAdminContext} /></div>
          <footer className="sa-footer">Civix · Administração da plataforma<span>Valores em BRL · Datas em UTC</span></footer>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  </div>;
}
