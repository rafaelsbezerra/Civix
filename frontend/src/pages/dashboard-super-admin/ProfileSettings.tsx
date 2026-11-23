import { useState, type CSSProperties } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { updateOwnProfile } from '../../lib/api';
import { ProfileForm } from '../../components/dashboard-super-admin/ProfileForm';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

const theme = {
  '--card': 'var(--sa-surface)',
  '--card-foreground': 'var(--sa-ink)',
  '--popover': 'var(--sa-surface)',
  '--popover-foreground': 'var(--sa-ink)',
  '--input': 'var(--sa-line)',
  '--accent': 'var(--sa-soft)',
  '--accent-foreground': 'var(--sa-ink)',
} as CSSProperties;

export default function ProfileSettings() {
  const { session, setProfile, handleError } = useOutletContext<SuperAdminContext>();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const save = async (input: { name: string; email: string }) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await updateOwnProfile(input);
      if (result.requiresLogin) {
        localStorage.removeItem('token');
        navigate('/login/empresa', { replace: true, state: { profileChanged: true } });
        return;
      }
      setProfile(result.user);
      setNotice('Perfil atualizado com sucesso.');
    } catch (failure) {
      setError(handleError(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={theme} className="mx-auto max-w-2xl space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-200"
        >
          {notice}
        </p>
      )}
      <ProfileForm
        name={session.user.name}
        email={session.user.email}
        busy={busy}
        onSave={save}
      />
    </div>
  );
}
