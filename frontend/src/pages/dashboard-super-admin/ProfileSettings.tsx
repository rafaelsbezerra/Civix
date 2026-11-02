import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { updateOwnProfile } from '../../lib/api';
import { ProfileForm } from '../../components/dashboard-super-admin/ProfileForm';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';
export default function ProfileSettings() {
  const { session, setProfile, handleError } = useOutletContext<SuperAdminContext>();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const save = async (input: { name: string; email: string }) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await updateOwnProfile(input);
      if (result.requiresLogin) { localStorage.removeItem('token'); navigate('/login/empresa', { replace: true, state: { profileChanged: true } }); return; }
      setProfile(result.user); setNotice('Perfil atualizado com sucesso.');
    } catch (failure) { setError(handleError(failure)); } finally { setBusy(false); }
  };
  return <><div className="sa-page-heading"><span className="sa-eyebrow">SUA CONTA</span><h1>Meu perfil</h1><p>Mantenha seus dados de acesso atualizados.</p></div>
    {error && <p className="sa-feedback sa-error" role="alert">{error}</p>}{notice && <p className="sa-feedback" role="status">{notice}</p>}
    <ProfileForm name={session.user.name} email={session.user.email} busy={busy} onSave={save} />
  </>;
}
