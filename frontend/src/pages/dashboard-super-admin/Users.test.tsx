import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Link, Outlet, Route, Routes } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ManagedUser, ManagedUserInput, PageResult, PlatformCompany, SessionProfile } from '../../lib/api';
import {
  ApiError,
  changeManagedUserState,
  getManagedUsers,
  getPlatformCompany,
  inviteManagedUser,
  updateManagedUser,
} from '../../lib/api';
import { SuperAdminLayout } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';
import Users from './Users';

vi.mock('../../lib/api', async original => ({
  ...await original<typeof import('../../lib/api')>(),
  changeManagedUserState: vi.fn(),
  getManagedUsers: vi.fn(),
  getPlatformCompany: vi.fn(),
  inviteManagedUser: vi.fn(),
  updateManagedUser: vi.fn(),
}));

const session: SessionProfile = {
  user: { id: 'super-1', name: 'Admin Inicial', email: 'admin@example.test', role: 'super_admin', companyId: null },
  permissions: { uploadCompanyCover: true },
};
const storageMemory = new Map<string, string>();
const storage = {
  getItem: vi.fn((key: string) => storageMemory.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storageMemory.set(key, value)),
  removeItem: vi.fn((key: string) => storageMemory.delete(key)),
  clear: vi.fn(() => storageMemory.clear()),
};

const companyA: PlatformCompany = {
  id: 'company-a',
  nome: 'Empresa A',
  cnpj: '11111111000111',
  descricao: 'Resumo A',
  descricao_detalhada: 'Descrição detalhada A',
  categoria: 'Tecnologia',
  cidade: 'Fortaleza',
  estado: 'CE',
  status: 'ativo',
  verificado: false,
  tamanho: 'pequena',
};

const companyB: PlatformCompany = {
  ...companyA,
  id: 'company-b',
  nome: 'Empresa B',
  cnpj: '22222222000122',
  status: 'inativo',
  deleted_at: '2026-10-01T12:00:00.000Z',
};

const companyAdminA: ManagedUser = {
  id: 'user-a',
  name: 'Ana da Empresa A',
  email: 'ana-a@example.test',
  role: 'admin_empresa',
  status: 'active',
  companyId: companyA.id,
  deactivationReason: null,
  invitationStatus: 'accepted',
};

const companyAttendant: ManagedUser = {
  id: 'attendant-a',
  name: 'Atendente da Empresa A',
  email: 'atendente-a@example.test',
  role: 'atendente',
  status: 'active',
  companyId: companyA.id,
  deactivationReason: null,
  invitationStatus: 'accepted',
};

const companyUserB: ManagedUser = {
  ...companyAdminA,
  id: 'user-b',
  name: 'Bruna da Empresa B',
  email: 'bruna-b@example.test',
  companyId: companyB.id,
};

const pendingAttendant: ManagedUser = {
  ...companyAttendant,
  status: 'pending',
  invitationStatus: 'pending',
};

const blockedAttendant: ManagedUser = {
  ...companyAttendant,
  status: 'blocked',
  invitationStatus: 'invalidated',
  deactivationReason: 'Afastamento registrado.',
};

const selfAdmin: ManagedUser = {
  id: 'super-1',
  name: session.user.name || 'Admin Inicial',
  email: session.user.email,
  role: 'super_admin',
  status: 'active',
  companyId: null,
  deactivationReason: null,
  invitationStatus: 'accepted',
};

const otherAdmin: ManagedUser = {
  ...selfAdmin,
  id: 'super-2',
  name: 'Outro Superadmin',
  email: 'outro-admin@example.test',
};

function pageResult<T>(data: T[], page = 1, pageSize = 20, total = data.length, totalPages = 1): PageResult<T> {
  return { data, meta: { page, pageSize, total, totalPages } };
}

function renderUsersRoutes(path = '/dashboard/super-admin/administrators') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <nav aria-label="Trocar empresa">
        <Link to="/dashboard/super-admin/companies/company-a/users">Abrir empresa A</Link>
        <Link to="/dashboard/super-admin/companies/company-b/users">Abrir empresa B</Link>
        <Link to="/dashboard/super-admin/administrators">Abrir superadmins</Link>
      </nav>
      <Routes>
        <Route path="/login/empresa" element={<p>Entre com seu novo e-mail</p>} />
        <Route element={<Outlet context={session} />}>
          <Route path="/dashboard/super-admin" element={<SuperAdminLayout />}>
            <Route path="companies/:companyId/users" element={<Users />} />
            <Route path="administrators" element={<Users />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeAll(() => {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
        const firstFocusable = this.querySelector<HTMLElement>(
          'textarea:not(:disabled), input:not(:disabled), select:not(:disabled), button:not(:disabled), a[href]',
        );
        firstFocusable?.focus();
      },
    });
  }
});

beforeEach(() => {
  vi.clearAllMocks();
  storageMemory.clear();
  vi.stubGlobal('localStorage', storage);
  vi.mocked(getManagedUsers).mockReset().mockImplementation(async (companyId, query = {}) => {
    if (companyId === null && query.status === 'active' && query.limit === 1) return pageResult([selfAdmin], 1, 1, 2, 2);
    if (companyId === null) return pageResult([selfAdmin, otherAdmin]);
    if (companyId === companyB.id) return pageResult([companyUserB]);
    return pageResult([companyAdminA]);
  });
  vi.mocked(getPlatformCompany).mockReset().mockImplementation(async id => id === companyB.id ? companyB : companyA);
  vi.mocked(inviteManagedUser).mockReset().mockResolvedValue(pendingAttendant);
  vi.mocked(updateManagedUser).mockReset().mockResolvedValue(companyAdminA);
  vi.mocked(changeManagedUserState).mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Gestão de usuários do superadmin', () => {
  it('troca o contexto entre empresas sem manter lista ou formulário da empresa anterior', async () => {
    renderUsersRoutes('/dashboard/super-admin/companies/company-a/users');

    expect(await screen.findByText(companyA.nome)).toBeInTheDocument();
    expect(await screen.findByText(companyAdminA.name)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar Ana da Empresa A' }));
    expect(screen.getByRole('form', { name: 'Editar usuário' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Abrir empresa B' }));

    expect(await screen.findByText(companyB.nome)).toBeInTheDocument();
    expect(await screen.findByText(companyUserB.name)).toBeInTheDocument();
    expect(screen.queryByText(companyAdminA.name)).not.toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Editar usuário' })).not.toBeInTheDocument();
    expect(getManagedUsers).toHaveBeenCalledWith(companyA.id, { q: '', role: '', status: '', page: 1 });
    expect(getManagedUsers).toHaveBeenCalledWith(companyB.id, { q: '', role: '', status: '', page: 1 });
    expect(getPlatformCompany).toHaveBeenCalledWith(companyA.id);
    expect(getPlatformCompany).toHaveBeenCalledWith(companyB.id);
    expect(screen.getByRole('button', { name: 'Convidar usuário' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Editar Bruna da Empresa B' })).toBeDisabled();
  });

  it('aplica nome, estado e perfil e navega as páginas sem perder filtros', async () => {
    const filteredUser = { ...companyAttendant, id: 'filtered-user', name: 'Atendente encontrado' };
    const secondPageUser = { ...companyAttendant, id: 'page-two-user', name: 'Atendente da página 2' };
    vi.mocked(getManagedUsers)
      .mockResolvedValueOnce(pageResult([companyAdminA], 1, 20, 45, 3))
      .mockResolvedValueOnce(pageResult([filteredUser], 1, 20, 25, 2))
      .mockResolvedValueOnce(pageResult([secondPageUser], 2, 20, 25, 2));

    renderUsersRoutes('/dashboard/super-admin/companies/company-a/users');

    expect(await screen.findByText(companyAdminA.name)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toHaveTextContent('Página 1 de 3');
    fireEvent.change(screen.getByLabelText('Nome ou e-mail'), { target: { value: 'atendente' } });
    fireEvent.change(screen.getByLabelText('Estado do acesso'), { target: { value: 'pending' } });
    fireEvent.change(screen.getByLabelText('Perfil'), { target: { value: 'atendente' } });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(await screen.findByText(filteredUser.name)).toBeInTheDocument();
    expect(getManagedUsers).toHaveBeenCalledWith(companyA.id, {
      q: 'atendente',
      role: 'atendente',
      status: 'pending',
      page: 1,
    });
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toHaveTextContent('Página 1 de 2');

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText(secondPageUser.name)).toBeInTheDocument();
    expect(getManagedUsers).toHaveBeenLastCalledWith(companyA.id, {
      q: 'atendente',
      role: 'atendente',
      status: 'pending',
      page: 2,
    });
  });

  it('envia convite global com campos permitidos e sem papel empresarial ou senha', async () => {
    const invitee: ManagedUser = {
      ...pendingAttendant,
      id: 'new-superadmin',
      name: 'Novo Superadmin',
      email: 'novo-superadmin@example.test',
      role: 'super_admin',
      companyId: null,
    };
    vi.mocked(inviteManagedUser).mockResolvedValue(invitee);

    renderUsersRoutes('/dashboard/super-admin/administrators');

    expect(await screen.findByRole('heading', { name: 'Superadmins' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Convidar usuário' }));
    const form = screen.getByRole('form', { name: 'Convidar usuário' });
    expect(within(form).queryByLabelText('Perfil')).not.toBeInTheDocument();
    expect(within(form).queryByLabelText(/senha/i)).not.toBeInTheDocument();
    fireEvent.change(within(form).getByLabelText('Nome'), { target: { value: '  Novo Superadmin  ' } });
    fireEvent.change(within(form).getByLabelText('E-mail'), { target: { value: 'novo-superadmin@example.test' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Enviar convite' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Convite enviado. A conta aguarda definição da senha.');
    expect(inviteManagedUser).toHaveBeenCalledWith(null, { name: 'Novo Superadmin', email: 'novo-superadmin@example.test' });
    const payload = vi.mocked(inviteManagedUser).mock.calls[0][1] as ManagedUserInput;
    expect(payload).not.toHaveProperty('role');
    expect(payload).not.toHaveProperty('companyId');
    expect(payload).not.toHaveProperty('password');
  });

  it('envia convite empresarial com perfil permitido e sem credenciais', async () => {
    vi.mocked(inviteManagedUser).mockResolvedValue(companyAttendant);

    renderUsersRoutes('/dashboard/super-admin/companies/company-a/users');

    fireEvent.click(await screen.findByRole('button', { name: 'Convidar usuário' }));
    const form = screen.getByRole('form', { name: 'Convidar usuário' });
    const role = within(form).getByLabelText('Perfil');
    expect(within(role).queryByRole('option', { name: 'Superadmin' })).not.toBeInTheDocument();
    fireEvent.change(within(form).getByLabelText('Nome'), { target: { value: 'Novo Atendente' } });
    fireEvent.change(within(form).getByLabelText('E-mail'), { target: { value: 'novo-atendente@example.test' } });
    fireEvent.change(role, { target: { value: 'atendente' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Enviar convite' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Convite enviado.');
    expect(inviteManagedUser).toHaveBeenCalledWith(companyA.id, {
      name: 'Novo Atendente',
      email: 'novo-atendente@example.test',
      role: 'atendente',
    });
    const payload = vi.mocked(inviteManagedUser).mock.calls[0][1] as ManagedUserInput;
    expect(payload).not.toHaveProperty('password');
    expect(payload).not.toHaveProperty('companyId');
  });

  it('reenvia convite somente para usuário pendente', async () => {
    vi.mocked(getManagedUsers).mockResolvedValue(pageResult([pendingAttendant]));
    vi.mocked(inviteManagedUser).mockResolvedValue(pendingAttendant);

    renderUsersRoutes('/dashboard/super-admin/companies/company-a/users');

    expect(await screen.findByText('Convite enviado')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar convite' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Novo convite enviado. O link anterior foi invalidado.');
    expect(inviteManagedUser).toHaveBeenCalledWith(companyA.id, {
      name: pendingAttendant.name,
      email: pendingAttendant.email,
      role: 'atendente',
    });
  });

  it('mostra erro 502 e mantém convite pendente após falha de envio de e-mail', async () => {
    vi.mocked(getManagedUsers).mockResolvedValue(pageResult([pendingAttendant]));
    vi.mocked(inviteManagedUser).mockRejectedValue(new ApiError('Serviço de e-mail indisponível.', 502));

    renderUsersRoutes('/dashboard/super-admin/companies/company-a/users');

    expect(await screen.findByText('Convite enviado')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar convite' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço de e-mail indisponível.');
    await waitFor(() => expect(getManagedUsers).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Convite enviado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reenviar convite' })).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.each([
    { action: 'suspension' as const, button: 'Desativar', title: 'Desativar usuário' },
    { action: 'delete' as const, button: 'Excluir atendente', title: 'Excluir atendente' },
  ])('$action exige justificativa e envia motivo sem espaços externos', async ({ action, button, title }) => {
    vi.mocked(getManagedUsers).mockResolvedValue(pageResult([companyAttendant]));

    renderUsersRoutes('/dashboard/super-admin/companies/company-a/users');

    fireEvent.click(await screen.findByRole('button', { name: button }));
    const dialog = screen.getByRole('dialog', { name: title });
    const reason = within(dialog).getByRole('textbox', { name: 'Motivo' });
    expect(reason).toHaveFocus();
    fireEvent.change(reason, { target: { value: '   ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o motivo.');
    expect(changeManagedUserState).not.toHaveBeenCalled();

    fireEvent.change(within(screen.getByRole('dialog')).getByRole('textbox', { name: 'Motivo' }), {
      target: { value: '  Solicitação registrada pela empresa.  ' },
    });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(changeManagedUserState).toHaveBeenCalledWith(
      companyA.id,
      companyAttendant.id,
      action,
      'Solicitação registrada pela empresa.',
    ));
    expect(await screen.findByRole('status')).toHaveTextContent('Acesso atualizado.');
  });

  it('reativa usuário bloqueado como pendente e orienta enviar novo convite', async () => {
    const reactivatedPending: ManagedUser = { ...blockedAttendant, status: 'pending', invitationStatus: 'pending' };
    vi.mocked(getManagedUsers)
      .mockResolvedValueOnce(pageResult([blockedAttendant]))
      .mockResolvedValueOnce(pageResult([reactivatedPending]));
    vi.mocked(changeManagedUserState).mockResolvedValue(reactivatedPending);

    renderUsersRoutes('/dashboard/super-admin/companies/company-a/users');

    fireEvent.click(await screen.findByRole('button', { name: 'Reativar' }));
    const dialog = screen.getByRole('dialog', { name: 'Reativar usuário' });
    expect(dialog).toHaveTextContent('Sem senha, será necessário enviar um novo convite.');
    expect(within(dialog).queryByLabelText('Motivo')).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Usuário reativado. Envie um novo convite para definir a senha.');
    expect(changeManagedUserState).toHaveBeenCalledWith(companyA.id, blockedAttendant.id, 'reactivation', undefined);
    expect(await screen.findByText('Convite enviado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reenviar convite' })).toBeInTheDocument();
  });

  it('bloqueia a própria desativação, permite outro superadmin e mostra conflito 409', async () => {
    vi.mocked(getManagedUsers).mockImplementation(async (companyId, query = {}) => {
      if (companyId === null && query.status === 'active' && query.limit === 1) return pageResult([selfAdmin], 1, 1, 2, 2);
      return pageResult([selfAdmin, otherAdmin]);
    });
    vi.mocked(changeManagedUserState).mockRejectedValue(new ApiError('Não é possível desativar o último superadmin ativo.', 409));

    renderUsersRoutes('/dashboard/super-admin/administrators');

    const disableButtons = await screen.findAllByRole('button', { name: 'Desativar' });
    expect(disableButtons[0]).toBeDisabled();
    expect(disableButtons[0]).toHaveAttribute('title', 'Você não pode desativar a própria conta.');
    expect(disableButtons[1]).toBeEnabled();

    fireEvent.click(disableButtons[1]);
    const dialog = screen.getByRole('dialog', { name: 'Desativar usuário' });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Motivo' }), {
      target: { value: 'Motivo válido para desativar.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não é possível desativar o último superadmin ativo.');
    expect(changeManagedUserState).toHaveBeenCalledWith(null, otherAdmin.id, 'suspension', 'Motivo válido para desativar.');
  });

  it('bloqueia a desativação do último superadmin ativo', async () => {
    vi.mocked(getManagedUsers).mockImplementation(async (companyId, query = {}) => {
      if (companyId === null && query.status === 'active' && query.limit === 1) return pageResult([otherAdmin], 1, 1, 1, 1);
      return pageResult([otherAdmin], 1, 20, 1, 1);
    });

    renderUsersRoutes('/dashboard/super-admin/administrators');

    const disable = await screen.findByRole('button', { name: 'Desativar' });
    expect(disable).toBeDisabled();
    expect(disable).toHaveAttribute('title', 'O último superadmin ativo deve ser preservado.');
    expect(getManagedUsers).toHaveBeenCalledWith(null, { status: 'active', limit: 1 });
  });

  it('atualiza o nome do próprio superadmin no cabeçalho', async () => {
    const updatedSelf: ManagedUser = { ...selfAdmin, name: 'Nome Atualizado' };
    let currentUsers = [selfAdmin, otherAdmin];
    vi.mocked(getManagedUsers).mockImplementation(async (companyId, query = {}) => {
      if (companyId === null && query.status === 'active' && query.limit === 1) return pageResult([currentUsers[0]], 1, 1, 2, 2);
      return pageResult(currentUsers);
    });
    vi.mocked(updateManagedUser).mockImplementation(async (_companyId, _id, input) => {
      expect(input).toEqual({ name: 'Nome Atualizado', email: selfAdmin.email });
      currentUsers = [updatedSelf, otherAdmin];
      return updatedSelf;
    });

    renderUsersRoutes('/dashboard/super-admin/administrators');

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Admin Inicial' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nome Atualizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar usuário' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Usuário atualizado.');
    expect(updateManagedUser).toHaveBeenCalledWith(null, selfAdmin.id, {
      name: 'Nome Atualizado',
      email: selfAdmin.email,
    });
    expect(screen.getByRole('link', { name: /Nome Atualizado/ })).toBeInTheDocument();
  });

  it('encerra a sessão e pede novo login quando o próprio e-mail muda', async () => {
    const updatedSelf: ManagedUser = { ...selfAdmin, email: 'novo-admin@example.test' };
    localStorage.setItem('token', 'token-sintetico');
    vi.mocked(updateManagedUser).mockResolvedValue(updatedSelf);

    renderUsersRoutes('/dashboard/super-admin/administrators');

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Admin Inicial' }));
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: updatedSelf.email } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar usuário' }));

    expect(await screen.findByText('Entre com seu novo e-mail')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(updateManagedUser).toHaveBeenCalledWith(null, selfAdmin.id, {
      name: selfAdmin.name,
      email: updatedSelf.email,
    });
  });

  it('distingue falha da lista de uma lista vazia e permite nova tentativa', async () => {
    vi.mocked(getManagedUsers)
      .mockRejectedValueOnce(new ApiError('Consulta de usuários indisponível.', 502))
      .mockResolvedValueOnce(pageResult([], 1, 20, 0, 0));

    renderUsersRoutes('/dashboard/super-admin/companies/company-a/users');

    expect(await screen.findByRole('alert')).toHaveTextContent('Consulta de usuários indisponível.');
    expect(screen.queryByText('Nenhum usuário encontrado.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Nenhum usuário encontrado.')).toBeInTheDocument();
    expect(getManagedUsers).toHaveBeenCalledTimes(2);
  });
});
