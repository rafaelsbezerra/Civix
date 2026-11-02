import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ApiError, getSessionProfile, type SessionProfile, type AuthenticatedRole } from '../../lib/api';

export function ProtectedRoute({ allowedRoles }: { allowedRoles: readonly AuthenticatedRole[] }) {
  const [session, setSession] = useState<SessionProfile | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unauthorized' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
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
  }, [attempt]);
  if (state === 'loading') return <p role="status">Verificando acesso...</p>;
  if (state === 'unauthorized') return <Navigate to="/login" replace />;
  if (state === 'error') return <div role="alert"><p>Não foi possível verificar seu acesso.</p><button onClick={() => { setSession(null);setState('loading');setAttempt(value => value + 1); }}>Tentar novamente</button></div>;
  if (!session || !allowedRoles.includes(session.user.role)) return <p role="alert">Acesso não permitido.</p>;
  return <Outlet context={session} />;
}
