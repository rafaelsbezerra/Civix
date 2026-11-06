import { useCallback, useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowLeft, Pencil, Plus, Power, Search, Send, Trash2 } from 'lucide-react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  changeManagedUserState,
  getManagedUsers,
  getPlatformCompany,
  inviteManagedUser,
  updateManagedUser,
  type ManagedUser,
  type ManagedUserInput,
} from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { ActionConfirmation } from '../../components/dashboard-super-admin/ActionConfirmation';
import { CompanyPagination } from '../../components/dashboard-super-admin/CompanyPagination';
import { UserForm } from '../../components/dashboard-super-admin/UserForm';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Field, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

type Editor = { kind: 'invite' } | { kind: 'update'; user: ManagedUser };

const STATUS_FILTER_LABELS: Record<string, string> = {
  '': 'Todos',
  active: 'Ativos',
  pending: 'Aguardando senha',
  blocked: 'Desativados',
};

const ROLE_FILTER_LABELS: Record<string, string> = {
  '': 'Todos',
  admin_empresa: 'Admin da empresa',
  atendente: 'Atendente',
};

const theme = {
  '--card': 'var(--sa-surface)',
  '--card-foreground': 'var(--sa-ink)',
  '--popover': 'var(--sa-surface)',
  '--popover-foreground': 'var(--sa-ink)',
  '--input': 'var(--sa-line)',
  '--accent': 'var(--sa-soft)',
  '--accent-foreground': 'var(--sa-ink)',
} as CSSProperties;

export default function Users() {
  const { companyId } = useParams();
  return <UsersWorkspace key={companyId || 'administrators'} companyId={companyId || null} />;
}

function UsersWorkspace({ companyId }: { companyId: string | null }) {
  const { session, setProfile, handleError } = useOutletContext<SuperAdminContext>();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [draftStatus, setDraftStatus] = useState('');
  const [draftRole, setDraftRole] = useState('');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [action, setAction] = useState<{
    user: ManagedUser;
    kind: 'suspension' | 'reactivation' | 'delete';
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const [users, company, active] = await Promise.all([
        getManagedUsers(companyId, { ...filters, page }),
        companyId ? getPlatformCompany(companyId) : Promise.resolve(null),
        companyId === null
          ? getManagedUsers(null, { status: 'active', limit: 1 })
          : Promise.resolve(null),
      ]);
      return { users, company, activeCount: active?.meta.total || 0 };
    } catch (failure) {
      throw new Error(handleError(failure), { cause: failure });
    }
  }, [companyId, filters, page, handleError]);

  const query = useAsyncQuery(JSON.stringify([companyId, filters, page, retry]), load);
  const unavailable =
    !!query.data?.company &&
    (!!query.data.company.deleted_at || query.data.company.status === 'inativo');
  const refresh = () => {
    setRetry(value => value + 1);
  };

  const save = async (input: ManagedUserInput) => {
    if (!editor || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const user =
        editor.kind === 'invite'
          ? await inviteManagedUser(companyId, input)
          : await updateManagedUser(companyId, editor.user.id, input);
      if (String(user.id) === String(session.user.id)) {
        if (user.email.toLowerCase() !== session.user.email.toLowerCase()) {
          localStorage.removeItem('token');
          navigate('/login/empresa', { replace: true, state: { profileChanged: true } });
          return;
        }
        setProfile({ ...session.user, name: user.name, email: user.email });
      }
      setEditor(null);
      setNotice(
        editor.kind === 'invite'
          ? 'Convite enviado. A conta aguarda definição da senha.'
          : 'Usuário atualizado.',
      );
      refresh();
    } catch (failure) {
      setError(handleError(failure));
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const resend = async (user: ManagedUser) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await inviteManagedUser(companyId, {
        name: user.name || 'Usuário',
        email: user.email,
        ...(companyId
          ? { role: user.role === 'admin_empresa' ? ('admin_empresa' as const) : ('atendente' as const) }
          : {}),
      });
      setNotice('Novo convite enviado. O link anterior foi invalidado.');
    } catch (failure) {
      setError(handleError(failure));
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const filter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setFilters({
      q: String(data.get('q') || ''),
      role: companyId ? draftRole : '',
      status: draftStatus,
    });
    setPage(1);
  };

  return (
    <div ref={setPortal} style={theme} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {companyId ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="min-h-10 rounded-xl px-4"
              render={<Link to={'/dashboard/super-admin/companies/' + companyId} role="link" />}
              nativeButton={false}
            >
              <ArrowLeft aria-hidden="true" />
              Voltar à empresa
            </Button>
            {query.data?.company?.nome && (
              <Badge variant="outline" className="rounded-lg px-3 py-1 text-sm font-medium">
                {query.data.company.nome}
              </Badge>
            )}
          </div>
        ) : (
          <div />
        )}
        <Button
          className="min-h-11 rounded-xl px-5"
          disabled={unavailable || query.loading || !!query.error}
          onClick={() => {
            setEditor({ kind: 'invite' });
            setError('');
          }}
        >
          <Plus aria-hidden="true" />
          Convidar usuário
        </Button>
      </div>

      {unavailable && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Empresa indisponível. A equipe permanece visível para consulta; reative a empresa para
          alterar acessos.
        </p>
      )}

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

      {editor && !unavailable && (
        <UserForm
          key={editor.kind === 'invite' ? 'invite' : String(editor.user.id)}
          user={editor.kind === 'update' ? editor.user : undefined}
          global={companyId === null}
          busy={busy}
          onSave={save}
          onCancel={() => setEditor(null)}
        />
      )}

      <Card className="rounded-2xl py-5">
        <CardContent>
          <form
            aria-label="Filtrar usuários"
            onSubmit={filter}
            className={`grid gap-4 md:grid-cols-2 ${
              companyId
                ? 'xl:grid-cols-[1.5fr_1fr_1fr_auto]'
                : 'xl:grid-cols-[2fr_1fr_auto]'
            } xl:items-end`}
          >
            <Field>
              <FieldLabel htmlFor="users-search-filter">Nome ou e-mail</FieldLabel>
              <Input
                id="users-search-filter"
                name="q"
                maxLength={200}
                className="h-10"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="users-status-filter">Estado do acesso</FieldLabel>
              <Select
                value={draftStatus || '__all__'}
                onValueChange={value => setDraftStatus(!value || value === '__all__' ? '' : value)}
              >
                <SelectTrigger
                  id="users-status-filter"
                  aria-label="Estado do acesso"
                  className="h-10 w-full bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50"
                >
                  <SelectValue>{STATUS_FILTER_LABELS[draftStatus] ?? 'Todos'}</SelectValue>
                </SelectTrigger>
                <SelectContent container={portal} alignItemWithTrigger={false}>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="pending">Aguardando senha</SelectItem>
                  <SelectItem value="blocked">Desativados</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {companyId && (
              <Field>
                <FieldLabel htmlFor="users-role-filter">Perfil</FieldLabel>
                <Select
                  value={draftRole || '__all__'}
                  onValueChange={value => setDraftRole(!value || value === '__all__' ? '' : value)}
                >
                  <SelectTrigger
                    id="users-role-filter"
                    aria-label="Perfil"
                    className="h-10 w-full bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50"
                  >
                    <SelectValue>{ROLE_FILTER_LABELS[draftRole] ?? 'Todos'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent container={portal} alignItemWithTrigger={false}>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="admin_empresa">Admin da empresa</SelectItem>
                    <SelectItem value="atendente">Atendente</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Button type="submit" className="min-h-10 px-5">
              <Search aria-hidden="true" />
              Filtrar
            </Button>
          </form>
        </CardContent>
      </Card>

      {query.loading ? (
        <p role="status" className="py-8 text-center text-sm text-muted-foreground">
          Carregando usuários…
        </p>
      ) : query.error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{(query.error as Error).message}</span>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <Card
          role="region"
          aria-label="Usuários administrativos"
          className="gap-0 rounded-2xl py-0"
        >
          {!query.data?.users.data.length ? (
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="px-6 font-medium text-muted-foreground">Usuário</TableHead>
                  <TableHead className="px-6 font-medium text-muted-foreground">Perfil</TableHead>
                  <TableHead className="px-6 font-medium text-muted-foreground">
                    Estado / convite
                  </TableHead>
                  <TableHead className="px-6 text-right font-medium text-muted-foreground">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.users.data.map(user => {
                  const own = String(user.id) === String(session.user.id);
                  const last =
                    companyId === null &&
                    user.status === 'active' &&
                    query.data!.activeCount <= 1;
                  const statusLabel =
                    user.status === 'active'
                      ? 'Ativo'
                      : user.status === 'blocked'
                        ? 'Desativado'
                        : user.invitationStatus === 'pending'
                          ? 'Convite enviado'
                          : 'Novo convite necessário';
                  const statusClass =
                    user.status === 'active'
                      ? 'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                      : user.status === 'blocked'
                        ? 'border-red-500/30 bg-red-500/12 text-red-700 dark:text-red-300'
                        : 'border-amber-500/30 bg-amber-500/12 text-amber-800 dark:text-amber-300';

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="px-6 py-4">
                        <div className="font-medium">{user.name || 'Sem nome informado'}</div>
                        <small className="block text-xs text-muted-foreground">{user.email}</small>
                        {user.deactivationReason && (
                          <small className="mt-0.5 block text-xs text-muted-foreground">
                            Motivo: {user.deactivationReason}
                          </small>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground">
                        {user.role === 'super_admin'
                          ? 'Superadmin'
                          : user.role === 'admin_empresa'
                            ? 'Admin da empresa'
                            : 'Atendente'}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className={statusClass}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-10"
                            disabled={busy || unavailable}
                            aria-label={'Editar ' + (user.name || user.email)}
                            title={'Editar ' + (user.name || user.email)}
                            onClick={() => setEditor({ kind: 'update', user })}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>

                          {user.status === 'pending' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-10"
                              disabled={busy || unavailable}
                              aria-label="Reenviar convite"
                              title="Reenviar convite"
                              onClick={() => resend(user)}
                            >
                              <Send aria-hidden="true" />
                            </Button>
                          )}

                          {user.status === 'blocked' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-10"
                              disabled={busy || unavailable || own}
                              aria-label="Reativar"
                              title="Reativar"
                              onClick={() => setAction({ user, kind: 'reactivation' })}
                            >
                              <Power aria-hidden="true" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-10"
                              disabled={busy || unavailable || (companyId === null && (own || last))}
                              aria-label="Desativar"
                              title={
                                own
                                  ? 'Você não pode desativar a própria conta.'
                                  : last
                                    ? 'O último superadmin ativo deve ser preservado.'
                                    : 'Desativar'
                              }
                              onClick={() => setAction({ user, kind: 'suspension' })}
                            >
                              <Power aria-hidden="true" />
                            </Button>
                          )}

                          {companyId && user.role === 'atendente' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-10 text-destructive hover:text-destructive"
                              disabled={busy || unavailable}
                              aria-label="Excluir atendente"
                              title="Excluir atendente"
                              onClick={() => setAction({ user, kind: 'delete' })}
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {query.data && <CompanyPagination meta={query.data.users.meta} onPage={setPage} />}
        </Card>
      )}

      {action && (
        <ActionConfirmation
          title={
            action.kind === 'delete'
              ? 'Excluir atendente'
              : action.kind === 'suspension'
                ? 'Desativar usuário'
                : 'Reativar usuário'
          }
          description={
            action.user.email +
            ': ' +
            (action.kind === 'reactivation'
              ? 'Será necessário novo login. Sem senha, será necessário enviar um novo convite.'
              : action.kind === 'delete'
                ? 'O acesso será removido e o registro preservado para manter referências.'
                : 'Todas as sessões serão revogadas. A reativação exigirá novo login.')
          }
          requireReason={action.kind !== 'reactivation'}
          onClose={() => setAction(null)}
          onConfirm={async reason => {
            try {
              const user = await changeManagedUserState(
                companyId,
                action.user.id,
                action.kind,
                action.kind === 'reactivation' ? undefined : reason,
              );
              setPage(1);
              refresh();
              setNotice(
                user?.status === 'pending'
                  ? 'Usuário reativado. Envie um novo convite para definir a senha.'
                  : 'Acesso atualizado.',
              );
            } catch (failure) {
              throw new Error(handleError(failure), { cause: failure });
            }
          }}
        />
      )}
    </div>
  );
}
