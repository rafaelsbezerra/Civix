import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompanyMetrics, PageResult, PlatformCompany, Plan, SessionProfile } from '../../lib/api';
import {
  changePlatformCompanyState,
  getPlatformCompanies,
  getPlatformCompany,
  getPlatformCompanyMetrics,
  getPlatformPlans,
  registerCompany,
  updatePlatformCompany,
} from '../../lib/api';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';
import Companies from './Companies';
import CompanyDetail from './CompanyDetail';
import CompanyEdit from './CompanyEdit';

vi.mock('../../lib/api', async original => ({
  ...await original<typeof import('../../lib/api')>(),
  changePlatformCompanyState: vi.fn(),
  getPlatformCompanies: vi.fn(),
  getPlatformCompany: vi.fn(),
  getPlatformCompanyMetrics: vi.fn(),
  getPlatformPlans: vi.fn(),
  registerCompany: vi.fn(),
  updatePlatformCompany: vi.fn(),
}));

const session: SessionProfile = {
  user: { id: 'super-1', name: 'Admin Inicial', email: 'admin@example.test', role: 'super_admin', companyId: null },
  permissions: { uploadCompanyCover: true },
};
const handleError = vi.fn((error: unknown) => error instanceof Error ? error.message : 'Falha inesperada.');
const context: SuperAdminContext = { session, setProfile: vi.fn(), handleError };

const company: PlatformCompany = {
  id: 'company-1',
  nome: 'Empresa de Exemplo',
  cnpj: '12345678000190',
  descricao: 'Resumo da empresa',
  descricao_detalhada: 'Descrição detalhada da empresa',
  categoria: 'Tecnologia',
  cidade: 'Fortaleza',
  estado: 'CE',
  status: 'ativo',
  verificado: false,
  tamanho: 'media',
  plan_id: 'plan-1',
  email: 'contato@example.test',
  telefone: '+5585999999999',
  endereco: 'Rua das Flores, 10',
  website: 'https://example.test',
  whatsapp: '+5585999999999',
};

const archivedCompany: PlatformCompany = {
  ...company,
  status: 'inativo',
  deleted_at: '2026-10-01T12:00:00.000Z',
  deactivation_reason: 'Solicitação administrativa registrada.',
};

const plan: Plan = {
  id: 'plan-1',
  name: 'Profissional',
  slug: 'profissional',
  description: 'Plano comercial',
  price: '59.90',
  billingPeriod: 'monthly',
  features: ['Catálogo'],
  limits: {},
  isFeatured: false,
  isActive: true,
  displayOrder: 10,
};

const nextPlan: Plan = { ...plan, id: 'plan-2', name: 'Avançado', slug: 'avancado', price: '99.00' };
const inactivePlan: Plan = { ...plan, id: 'plan-inactive', name: 'Plano inativo', isActive: false };
const freePlan: Plan = { ...plan, id: 'plan-free', name: 'Plano gratuito', price: '0.00' };
const companyMetrics: CompanyMetrics = {
  total: 42,
  active: 37,
  inactive: 3,
  archived: 2,
  byPlan: [
    { planId: 'plan-1', planName: 'Profissional', count: 23 },
    { planId: 'initial', planName: 'Inicial', count: 0 },
    { planId: 'pro', planName: 'Pro', count: 0 },
    { planId: 'plan-old', planName: 'Plano inativo', count: 18 },
    { planId: 'plan-demo', planName: 'PLANO gratuito', count: 0 },
    { planId: null, planName: 'Sem plano', count: 1 },
  ],
};

function pageResult(data: PlatformCompany[], page = 1, pageSize = 20, total = data.length, totalPages = 1): PageResult<PlatformCompany> {
  return { data, meta: { page, pageSize, total, totalPages } };
}

function renderCompanyRoutes(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/super-admin/companies" element={<Outlet context={context} />}>
          <Route index element={<Companies />} />
          <Route path=":companyId" element={<CompanyDetail />} />
          <Route path=":companyId/edit" element={<CompanyEdit />} />
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
  handleError.mockClear();
  vi.mocked(getPlatformCompanies).mockReset().mockResolvedValue(pageResult([company]));
  vi.mocked(getPlatformCompany).mockReset().mockResolvedValue(company);
  vi.mocked(getPlatformCompanyMetrics).mockReset().mockResolvedValue(companyMetrics);
  vi.mocked(getPlatformPlans).mockReset().mockResolvedValue([plan]);
  vi.mocked(changePlatformCompanyState).mockReset().mockResolvedValue(undefined);
  vi.mocked(updatePlatformCompany).mockReset().mockResolvedValue(company);
  vi.mocked(registerCompany).mockReset();
});

describe('Empresas do superadmin', () => {
  it('mantém as métricas agregadas independentes dos filtros e da paginação da lista', async () => {
    const user = userEvent.setup();
    const filteredCompany = { ...company, id: 'company-filtered', nome: 'Empresa arquivada filtrada' };
    const nextPageCompany = { ...company, id: 'company-page-2', nome: 'Empresa da página 2' };
    vi.mocked(getPlatformCompanies)
      .mockResolvedValueOnce(pageResult([company], 1, 20, 42, 3))
      .mockResolvedValueOnce(pageResult([filteredCompany], 1, 20, 25, 2))
      .mockResolvedValueOnce(pageResult([nextPageCompany], 2, 20, 25, 2));

    renderCompanyRoutes('/super-admin/companies');

    const metrics = await screen.findByRole('region', { name: 'Métricas de empresas' });
    expect(metrics).toHaveTextContent('Total de empresas');
    expect(metrics).toHaveTextContent('42');
    expect(metrics.children).toHaveLength(3);
    const planMetrics = within(metrics).getByRole('region', { name: 'Empresas por plano' });
    const planMeters = within(planMetrics).getAllByRole('meter');
    expect(planMeters).toHaveLength(3);
    expect(within(planMetrics).getByRole('meter', { name: 'Empresas em Profissional' })).toHaveAttribute('aria-valuenow', '23');
    expect(within(planMetrics).getByRole('meter', { name: 'Empresas em Inicial' })).toHaveAttribute('aria-valuenow', '0');
    expect(within(planMetrics).getByRole('meter', { name: 'Empresas em Pro' })).toHaveAttribute('aria-valuenow', '0');
    expect(planMetrics).not.toHaveTextContent('Plano inativo');
    expect(planMetrics).not.toHaveTextContent('PLANO gratuito');
    expect(planMetrics).not.toHaveTextContent('Sem plano');
    const statusMetrics = within(metrics).getByRole('region', { name: 'Situação das empresas' });
    expect(statusMetrics).toHaveTextContent('Empresas ativas');
    expect(statusMetrics).toHaveTextContent('37');
    expect(statusMetrics).toHaveTextContent('88% da base');
    expect(statusMetrics).toHaveTextContent('3 inativas · 2 arquivadas');
    expect(within(statusMetrics).getByRole('meter', { name: 'Percentual de empresas ativas' })).toHaveAttribute('aria-valuenow', '88');
    expect(getPlatformCompanyMetrics).toHaveBeenCalledTimes(1);
    expect(getPlatformCompanyMetrics).toHaveBeenCalledWith();

    fireEvent.change(screen.getByLabelText('Nome ou CNPJ'), { target: { value: 'arquivada' } });
    await user.click(screen.getByLabelText('Estado do cadastro'));
    await user.click(await screen.findByRole('option', { name: 'Arquivadas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(await screen.findByText('Empresa arquivada filtrada')).toBeInTheDocument();
    expect(getPlatformCompanies).toHaveBeenLastCalledWith({ q: 'arquivada', status: 'archived', planId: '', page: 1 });
    expect(metrics).toHaveTextContent('42');
    expect(getPlatformCompanyMetrics).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(await screen.findByText('Empresa da página 2')).toBeInTheDocument();
    expect(getPlatformCompanies).toHaveBeenLastCalledWith({ q: 'arquivada', status: 'archived', planId: '', page: 2 });
    expect(metrics).toHaveTextContent('42');
    expect(getPlatformCompanyMetrics).toHaveBeenCalledTimes(1);
  });

  it('exibe valores zero no total e na barra sem dividir por zero', async () => {
    vi.mocked(getPlatformCompanyMetrics).mockResolvedValue({
      total: 0,
      active: 0,
      inactive: 0,
      archived: 0,
      byPlan: [{ planId: plan.id, planName: plan.name, count: 0 }],
    });
    vi.mocked(getPlatformCompanies).mockResolvedValue(pageResult([], 1, 100, 0, 0));

    renderCompanyRoutes('/super-admin/companies');

    const metrics = await screen.findByRole('region', { name: 'Métricas de empresas' });
    expect(metrics.children).toHaveLength(3);
    expect(metrics.children[0]).toHaveTextContent('Total de empresas');
    expect(metrics.children[0]).toHaveTextContent('0');
    const zeroMeter = within(metrics).getByRole('meter', { name: 'Empresas em Profissional' });
    expect(zeroMeter).toHaveAttribute('aria-valuemax', '1');
    expect(zeroMeter).toHaveAttribute('aria-valuenow', '0');
    expect(zeroMeter).toHaveAttribute('aria-valuetext', '0 empresas');
    expect(zeroMeter.firstElementChild).toHaveStyle({ width: '0%' });
    const activeMeter = within(metrics).getByRole('meter', { name: 'Percentual de empresas ativas' });
    expect(activeMeter).toHaveAttribute('aria-valuenow', '0');
    expect(activeMeter.firstElementChild).toHaveStyle({ width: '0%' });
  });

  it('mantém o botão de consulta navegável e com nome acessível', async () => {
    renderCompanyRoutes('/super-admin/companies');

    const consultationButton = await screen.findByRole('button', { name: 'Consultar Empresa de Exemplo' });
    expect(consultationButton).toHaveAttribute('href', '/super-admin/companies/company-1');
    expect(consultationButton).toHaveAttribute('title', 'Consultar Empresa de Exemplo');
    expect(consultationButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('página os resultados, preserva os filtros e reinicia na primeira página ao filtrar', async () => {
    const user = userEvent.setup();
    vi.mocked(getPlatformCompanies)
      .mockResolvedValueOnce(pageResult([company], 1, 20, 45, 3))
      .mockResolvedValueOnce(pageResult([{ ...company, id: 'company-filtered', nome: 'Empresa filtrada' }], 1, 20, 25, 2))
      .mockResolvedValueOnce(pageResult([{ ...company, id: 'company-page-2', nome: 'Empresa da página 2' }], 2, 20, 25, 2));

    renderCompanyRoutes('/super-admin/companies');

    expect(await screen.findByText('Empresa de Exemplo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toHaveTextContent('Página 1 de 3');
    expect(getPlatformCompanies).toHaveBeenCalledWith({ q: '', status: '', planId: '', page: 1 });

    fireEvent.change(screen.getByLabelText('Nome ou CNPJ'), { target: { value: 'Fortaleza Tech' } });
    await user.click(screen.getByLabelText('Estado do cadastro'));
    await user.click(await screen.findByRole('option', { name: 'Arquivadas' }));
    await user.click(screen.getByLabelText('Plano'));
    await user.click(await screen.findByRole('option', { name: 'Profissional' }));
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(await screen.findByText('Empresa filtrada')).toBeInTheDocument();
    expect(getPlatformCompanies).toHaveBeenCalledWith({
      q: 'Fortaleza Tech',
      status: 'archived',
      planId: 'plan-1',
      page: 1,
    });
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toHaveTextContent('Página 1 de 2');

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(await screen.findByText('Empresa da página 2')).toBeInTheDocument();
    expect(getPlatformCompanies).toHaveBeenLastCalledWith({
      q: 'Fortaleza Tech',
      status: 'archived',
      planId: 'plan-1',
      page: 2,
    });
  });

  it('distingue falha da API de uma lista vazia e permite repetir a consulta', async () => {
    vi.mocked(getPlatformCompanies)
      .mockRejectedValueOnce(new Error('Consulta de empresas indisponível.'))
      .mockResolvedValueOnce(pageResult([], 1, 20, 0, 0));

    renderCompanyRoutes('/super-admin/companies');

    expect(await screen.findByRole('alert')).toHaveTextContent('Consulta de empresas indisponível.');
    expect(screen.queryByText('Nenhuma empresa encontrada.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Nenhuma empresa encontrada.')).toBeInTheDocument();
    expect(getPlatformCompanies).toHaveBeenCalledTimes(2);
  });

  it('a API aceita page e limit e preserva pageSize nos metadados', async () => {
    const actualApi = await vi.importActual<typeof import('../../lib/api')>('../../lib/api');
    const response = new Response(JSON.stringify({
      data: [company],
      meta: { page: 2, pageSize: 25, total: 26, totalPages: 2 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'token-sintetico') });
    vi.stubGlobal('fetch', fetchMock);

    const result = await actualApi.getPlatformCompanies({
      page: 2,
      limit: 25,
      q: 'Fortaleza Tech',
      status: 'archived',
      planId: 'plan-1',
    });

    const requestUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestUrl.pathname).toBe('/api/v1/platform/companies');
    expect(Object.fromEntries(requestUrl.searchParams)).toEqual({
      page: '2',
      limit: '25',
      q: 'Fortaleza Tech',
      status: 'archived',
      planId: 'plan-1',
    });
    expect(result.meta.pageSize).toBe(25);
    expect(result.meta.page).toBe(2);
  });

  it('restaura empresa arquivada e informa que ela continuará inativa', async () => {
    vi.mocked(getPlatformCompany).mockResolvedValue(archivedCompany);

    renderCompanyRoutes('/super-admin/companies/company-1');

    expect(await screen.findByText('Restauração preserva a empresa inativa. Reative explicitamente para liberar catálogo e acesso.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Empresa arquivada' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar empresa' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restaurar empresa' }));
    expect(screen.getByRole('dialog', { name: 'Restaurar empresa' })).toHaveTextContent('A empresa continuará inativa após restaurar.');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(changePlatformCompanyState).toHaveBeenCalledWith('company-1', 'restoration', undefined));
    expect(changePlatformCompanyState).not.toHaveBeenCalledWith('company-1', 'reactivation', undefined);
  });

  it.each([
    ['suspension', 'Desativar empresa'],
    ['archive', 'Arquivar empresa'],
  ] as const)('%s exige motivo e envia texto com espaços removidos', async (action, actionLabel) => {
    renderCompanyRoutes('/super-admin/companies/company-1');

    fireEvent.click(await screen.findByRole('button', { name: actionLabel }));
    const dialog = screen.getByRole('dialog', { name: actionLabel });
    const reason = within(dialog).getByRole('textbox', { name: 'Motivo' });
    expect(reason).toHaveFocus();

    fireEvent.change(reason, { target: { value: '   ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o motivo.');
    expect(changePlatformCompanyState).not.toHaveBeenCalled();

    fireEvent.change(within(screen.getByRole('dialog')).getByRole('textbox', { name: 'Motivo' }), {
      target: { value: '  Solicitação registrada pela equipe.  ' },
    });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(changePlatformCompanyState).toHaveBeenCalledWith(
      'company-1',
      action,
      'Solicitação registrada pela equipe.',
    ));
  });

  it('preserva o plano atual inativo ao editar somente dados da empresa', async () => {
    vi.mocked(getPlatformPlans).mockResolvedValue([{ ...plan, isActive:false }]);
    renderCompanyRoutes('/super-admin/companies/company-1/edit');
    const name = await screen.findByLabelText('Nome da empresa');
    expect(screen.getByLabelText('Plano comercial')).toHaveValue(plan.id);
    expect(screen.getByRole('option', { name:/inativo — vínculo atual/ })).toBeInTheDocument();
    fireEvent.change(name,{ target:{ value:'Empresa com plano preservado' } });
    fireEvent.click(screen.getByRole('button',{name:'Salvar empresa'}));
    await waitFor(()=>expect(updatePlatformCompany).toHaveBeenCalledWith(company.id,expect.objectContaining({ planId:plan.id,nome:'Empresa com plano preservado' })));
    expect(registerCompany).not.toHaveBeenCalled();
  });

  it('edita somente campos permitidos, limpa contatos com null e não lança venda automaticamente', async () => {
    vi.mocked(getPlatformPlans).mockResolvedValue([plan, nextPlan, inactivePlan, freePlan]);

    renderCompanyRoutes('/super-admin/companies/company-1/edit');

    const nameField = await screen.findByLabelText('Nome da empresa');
    const planField = screen.getByLabelText('Plano comercial');
    expect(within(planField).getByRole('option', { name: /Profissional/ })).toBeInTheDocument();
    expect(within(planField).getByRole('option', { name: /Avançado/ })).toBeInTheDocument();
    expect(within(planField).queryByRole('option', { name: /Plano inativo/ })).not.toBeInTheDocument();
    expect(within(planField).queryByRole('option', { name: /Plano gratuito/ })).not.toBeInTheDocument();
    expect(screen.getAllByText(/A alteração do plano não gera uma venda automática/).length).toBeGreaterThan(0);

    fireEvent.change(nameField, { target: { value: 'Empresa Atualizada' } });
    fireEvent.change(planField, { target: { value: 'plan-2' } });
    for (const label of ['E-mail da empresa', 'Telefone', 'Endereço', 'Site', 'WhatsApp']) {
      fireEvent.change(screen.getByLabelText(label), { target: { value: '' } });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Salvar empresa' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Empresa atualizada. Nenhuma venda foi lançada automaticamente.');
    expect(screen.getByRole('link', { name: 'Registrar venda manual' })).toHaveAttribute(
      'href',
      '/super-admin/sales/new?companyId=company-1',
    );

    const input = vi.mocked(updatePlatformCompany).mock.calls[0][1];
    expect(input).toEqual({
      nome: 'Empresa Atualizada',
      cnpj: company.cnpj,
      descricao: company.descricao,
      descricao_detalhada: company.descricao_detalhada,
      categoria: company.categoria,
      cidade: company.cidade,
      estado: company.estado,
      tamanho: company.tamanho,
      planId: 'plan-2',
      email: null,
      telefone: null,
      endereco: null,
      website: null,
      whatsapp: null,
    });
    for (const serverField of ['id', 'status', 'verificado', 'deleted_at', 'deactivation_reason', 'plan_id', 'operationId']) {
      expect(input).not.toHaveProperty(serverField);
    }
    expect(registerCompany).not.toHaveBeenCalled();
  });
});
