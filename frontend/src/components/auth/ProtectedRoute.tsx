import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ApiError, getSessionProfile, type SessionProfile, type AuthenticatedRole } from '../../lib/api';

export function ProtectedRoute({ allowedRoles }: { allowedRoles: readonly AuthenticatedRole[] }) {
  const [session, setSession] = useState<SessionProfile | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unauthorized' | 'error'>('loading');
  useEffect(() => {
    let active = true;
    getSessionProfile().then(profile => {
      if (active) { setSession(profile); setState('ready'); }
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem('token');
        setState('unauthorized');
      } else { setState('error'); }
    });
    return () => { active = false; };
  }, []);
  if (state === 'loading') return <p role="status">Verificando acesso...</p>;
  if (state === 'unauthorized') return <Navigate to="/login" replace />;
  if (state === 'error') return <p role="alert">Não foi possível verificar seu acesso. Tente novamente.</p>;
  if (!session || !allowedRoles.includes(session.user.role)) return <p role="alert">Acesso não permitido.</p>;
  return <Outlet context={session} />;
}
