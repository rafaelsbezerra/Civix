import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { changeManagedUserState, getManagedUsers, getPlatformCompany, inviteManagedUser, updateManagedUser, type ManagedUser, type ManagedUserInput } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Pagination } from '../../components/ui/Pagination';
import { UserForm } from '../../components/dashboard-super-admin/UserForm';
import { ActionConfirmation } from '../../components/dashboard-super-admin/ActionConfirmation';
import { Button } from '../../components/ui/button';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

type Editor = { kind: 'invite' } | { kind: 'update'; user: ManagedUser };
export default function Users() {
  const { companyId } = useParams();
  return <UsersWorkspace key={companyId || 'administrators'} companyId={companyId || null} />;
}
function UsersWorkspace({ companyId }: { companyId: string | null }) {
  const { session, setProfile, handleError } = useOutletContext<SuperAdminContext>();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [action, setAction] = useState<{ user: ManagedUser; kind: 'suspension' | 'reactivation' | 'delete' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    try {
      const [users, company, active] = await Promise.all([getManagedUsers(companyId, { ...filters, page }), companyId ? getPlatformCompany(companyId) : Promise.resolve(null), companyId === null ? getManagedUsers(null, { status: 'active', limit: 1 }) : Promise.resolve(null)]);
      return { users, company, activeCount: active?.meta.total || 0 };
    } catch (failure) { throw new Error(handleError(failure), { cause: failure }); }
  }, [companyId, filters, page, handleError]);
  const query = useAsyncQuery(JSON.stringify([companyId, filters, page, retry]), load);
  const unavailable = !!query.data?.company && (!!query.data.company.deleted_at || query.data.company.status === 'inativo');
  const refresh = () => { setRetry(value => value + 1); };
  const save = async (input: ManagedUserInput) => {
    if (!editor || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const user = editor.kind === 'invite' ? await inviteManagedUser(companyId, input) : await updateManagedUser(companyId, editor.user.id, input);
      if (String(user.id) === String(session.user.id)) {
        if (user.email.toLowerCase() !== session.user.email.toLowerCase()) { localStorage.removeItem('token'); navigate('/login/empresa', { replace: true, state: { profileChanged: true } }); return; }
        setProfile({ ...session.user, name: user.name, email: user.email });
      }
      setEditor(null); setNotice(editor.kind === 'invite' ? 'Convite enviado. A conta aguarda definição da senha.' : 'Usuário atualizado.'); refresh();
    } catch (failure) { setError(handleError(failure)); refresh(); } finally { setBusy(false); }
  };
  const resend = async (user: ManagedUser) => {
    setBusy(true); setError(''); setNotice('');
    try { await inviteManagedUser(companyId, { name: user.name || 'Usuário', email: user.email, ...(companyId ? { role: user.role === 'admin_empresa' ? 'admin_empresa' as const : 'atendente' as const } : {}) }); setNotice('Novo convite enviado. O link anterior foi invalidado.'); }
    catch (failure) { setError(handleError(failure)); } finally { setBusy(false); refresh(); }
  };
  const filter = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); setFilters({ q: String(data.get('q') || ''), role: String(data.get('role') || ''), status: String(data.get('status') || '') }); setPage(1); };
  return <><div className="sa-page-heading sa-heading-row"><div>{companyId && <Link className="sa-text-link" to={'/super-admin/companies/' + companyId}>Voltar à empresa</Link>}<span className="sa-eyebrow">{companyId ? 'ACESSOS EMPRESARIAIS' : 'ADMINISTRAÇÃO DA PLATAFORMA'}</span><h1>{companyId ? 'Equipe empresarial' : 'Superadmins'}</h1><p>{query.data?.company?.nome || (companyId ? 'Equipe vinculada à empresa.' : 'Todos os superadmins têm os mesmos poderes.')}</p></div><Button className="sa-button" disabled={unavailable || query.loading || !!query.error} onClick={() => { setEditor({ kind: 'invite' }); setError(''); }}>Convidar usuário</Button></div>
    {unavailable && <p className="sa-feedback">Empresa indisponível. A equipe permanece visível para consulta; reative a empresa para alterar acessos.</p>}
    {error && <p className="sa-feedback sa-error" role="alert">{error}</p>}{notice && <p className="sa-feedback" role="status">{notice}</p>}
    {editor && !unavailable && <UserForm key={editor.kind === 'invite' ? 'invite' : String(editor.user.id)} user={editor.kind === 'update' ? editor.user : undefined} global={companyId === null} busy={busy} onSave={save} onCancel={() => setEditor(null)} />}
    <form className="sa-form sa-panel sa-filter-form" aria-label="Filtrar usuários" onSubmit={filter}><label>Nome ou e-mail<input name="q" maxLength={200} /></label><label>Estado do acesso<select name="status"><option value="">Todos</option><option value="active">Ativos</option><option value="pending">Aguardando senha</option><option value="blocked">Desativados</option></select></label>{companyId && <label>Perfil<select name="role"><option value="">Todos</option><option value="admin_empresa">Admin da empresa</option><option value="atendente">Atendente</option></select></label>}<button className="sa-text-link" type="submit">Filtrar</button></form>
    {query.loading ? <p role="status">Carregando usuários…</p> : query.error ? <p className="sa-feedback sa-error" role="alert">{(query.error as Error).message}<button onClick={refresh}>Tentar novamente</button></p> : <section className="sa-panel" aria-label="Usuários administrativos">
      {!query.data?.users.data.length ? <p className="sa-empty">Nenhum usuário encontrado.</p> : <div className="sa-table-scroll"><table className="sa-table"><thead><tr><th>Usuário</th><th>Perfil</th><th>Estado / convite</th><th>Ações</th></tr></thead><tbody>{query.data.users.data.map(user => {
        const own = String(user.id) === String(session.user.id);
        const last = companyId === null && user.status === 'active' && query.data!.activeCount <= 1;
        return <tr key={user.id}><td><strong>{user.name || 'Sem nome informado'}</strong><small>{user.email}</small>{user.deactivationReason && <small>Motivo: {user.deactivationReason}</small>}</td><td>{user.role === 'super_admin' ? 'Superadmin' : user.role === 'admin_empresa' ? 'Admin da empresa' : 'Atendente'}</td><td>{user.status === 'active' ? 'Ativo' : user.status === 'blocked' ? 'Desativado' : user.invitationStatus === 'pending' ? 'Convite enviado' : 'Novo convite necessário'}</td><td className="sa-row-actions"><button disabled={busy || unavailable} onClick={() => setEditor({ kind: 'update', user })}>Editar {user.name || user.email}</button>
          {user.status === 'pending' && <button disabled={busy || unavailable} onClick={() => resend(user)}>Reenviar convite</button>}
          {user.status === 'blocked' ? <button disabled={busy || unavailable || own} onClick={() => setAction({ user, kind: 'reactivation' })}>Reativar</button> : <button disabled={busy || unavailable || companyId === null && (own || last)} title={own ? 'Você não pode desativar a própria conta.' : last ? 'O último superadmin ativo deve ser preservado.' : undefined} onClick={() => setAction({ user, kind: 'suspension' })}>Desativar</button>}
          {companyId && user.role === 'atendente' && <button disabled={busy || unavailable} onClick={() => setAction({ user, kind: 'delete' })}>Excluir atendente</button>}
        </td></tr>;
      })}</tbody></table></div>}{query.data && <Pagination meta={query.data.users.meta} onPage={setPage} />}
    </section>}
    {action && <ActionConfirmation title={action.kind === 'delete' ? 'Excluir atendente' : action.kind === 'suspension' ? 'Desativar usuário' : 'Reativar usuário'} description={action.user.email + ': ' + (action.kind === 'reactivation' ? 'Será necessário novo login. Sem senha, será necessário enviar um novo convite.' : action.kind === 'delete' ? 'O acesso será removido e o registro preservado para manter referências.' : 'Todas as sessões serão revogadas. A reativação exigirá novo login.')} requireReason={action.kind !== 'reactivation'} onClose={() => setAction(null)} onConfirm={async reason => {
      try { const user = await changeManagedUserState(companyId, action.user.id, action.kind, action.kind === 'reactivation' ? undefined : reason); setPage(1); refresh(); setNotice(user?.status === 'pending' ? 'Usuário reativado. Envie um novo convite para definir a senha.' : 'Acesso atualizado.'); }
      catch (failure) { throw new Error(handleError(failure), { cause: failure }); }
    }} />}
  </>;
}
