import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageResult, PlatformCompany, PlatformSale, Plan, SessionProfile } from '../../lib/api';
import {
  createManualSale,
  deletePlatformSale,
  getPlatformCompanies,
  getPlatformCompany,
  getPlatformPlans,
  getPlatformSales,
  updatePlatformCompany,
} from '../../lib/api';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';
import Sales from './Sales';
import SaleCreate from './SaleCreate';

vi.mock('../../lib/api', async original => ({
  ...await original<typeof import('../../lib/api')>(),
  createManualSale: vi.fn(),
  deletePlatformSale: vi.fn(),
  getPlatformCompanies: vi.fn(),
  getPlatformCompany: vi.fn(),
  getPlatformPlans: vi.fn(),
  getPlatformSales: vi.fn(),
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

const sale: PlatformSale = {
  id: 'sale-1',
  companyId: company.id,
  companyName: company.nome,
  planId: plan.id,
  planName: plan.name,
  origin: 'manual',
  pricingMode: 'manual_amount',
  planPrice: null,
  planBillingPeriod: null,
  amount: '120.50',
  currency: 'BRL',
  description: 'Ajuste comercial autorizado',
  soldAt: '2025-03-04T10:15:00.000Z',
  createdAt: '2025-03-05T12:00:00.000Z',
  createdBy: 'super-1',
};

function pageResult<T>(data: T[], page = 1, pageSize = 20, total = data.length, totalPages = 1): PageResult<T> {
  return { data, meta: { page, pageSize, total, totalPages } };
}

function renderSalesRoutes(path = '/dashboard/super-admin/sales') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard/super-admin/sales" element={<Outlet context={context} />}>
          <Route index element={<Sales />} />
          <Route path="new" element={<SaleCreate />} />
        </Route>
        <Route path="/dashboard/super-admin/companies/:companyId" element={<p>Empresa consultada</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function chooseCompanyForNewSale() {
  renderSalesRoutes('/dashboard/super-admin/sales/new');
  fireEvent.click(await screen.findByRole('button', { name: /Empresa de Exemplo/ }));
  await screen.findByLabelText('Origem do valor');
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
  vi.mocked(createManualSale).mockReset();
  vi.mocked(deletePlatformSale).mockReset().mockResolvedValue(undefined);
  vi.mocked(getPlatformCompanies).mockReset().mockResolvedValue(pageResult([company]));
  vi.mocked(getPlatformCompany).mockReset().mockResolvedValue(company);
  vi.mocked(getPlatformPlans).mockReset().mockResolvedValue([plan]);
  vi.mocked(getPlatformSales).mockReset().mockResolvedValue(pageResult([sale]));
  vi.mocked(updatePlatformCompany).mockReset();
  handleError.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Vendas do superadmin', () => {
  it('seleciona uma empresa e lança pelo plano vigente sem enviar montante manual', async () => {
    const operationId = '00000000-0000-4000-8000-000000000001';
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(operationId);
    const returnedSale: PlatformSale = {
      ...sale,
      amount: '123.45',
      pricingMode: 'company_plan',
      planPrice: '59.90',
      soldAt: '2020-05-01T14:30:00.000Z',
    };
    vi.mocked(createManualSale).mockResolvedValue({ sale: returnedSale, replayed: false });

    await chooseCompanyForNewSale();

    expect(screen.getByLabelText('Origem do valor')).toHaveValue('company_plan');
    expect(screen.queryByLabelText('Valor em reais')).not.toBeInTheDocument();
    expect(screen.getByText('59.90 BRL')).toBeInTheDocument();
    expect(getPlatformCompany).toHaveBeenCalledWith(company.id);
    expect(getPlatformPlans).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('Data comercial (UTC)'), { target: { value: '2020-05-01T14:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar venda manual' }));

    expect(await screen.findByRole('heading', { name: 'Venda registrada.' })).toBeInTheDocument();
    expect(createManualSale).toHaveBeenCalledWith({
      companyId: company.id,
      soldAt: '2020-05-01T14:30:00.000Z',
      pricingMode: 'company_plan',
      operationId,
    });
    const result = screen.getByRole('region', { name: 'Venda registrada' });
    expect(result).toHaveTextContent('123,45');
    expect(result).toHaveTextContent('2020-05-01T14:30:00.000Z UTC');
    expect(updatePlatformCompany).not.toHaveBeenCalled();
  });

  it('exige justificativa não vazia no modo de valor manual', async () => {
    await chooseCompanyForNewSale();
    fireEvent.change(screen.getByLabelText('Origem do valor'), { target: { value: 'manual_amount' } });
    fireEvent.change(screen.getByLabelText('Valor em reais'), { target: { value: '120,50' } });
    fireEvent.change(screen.getByLabelText(/Descrição \/ motivo/), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar venda manual' }));

    expect(createManualSale).not.toHaveBeenCalled();
  });

  it('reutiliza operationId após falha idêntica e cria outra chave quando o conteúdo muda', async () => {
    const firstOperationId = '00000000-0000-4000-8000-000000000001';
    const secondOperationId = '00000000-0000-4000-8000-000000000002';
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce(firstOperationId)
      .mockReturnValueOnce(secondOperationId);
    const returnedSale: PlatformSale = {
      ...sale,
      amount: '151.25',
      description: 'Descrição retornada pela API',
      soldAt: '2024-11-02T13:45:00.000Z',
    };
    vi.mocked(createManualSale)
      .mockRejectedValueOnce(new Error('Conexão interrompida.'))
      .mockRejectedValueOnce(new Error('A API continua indisponível.'))
      .mockResolvedValueOnce({ sale: returnedSale, replayed: false });

    await chooseCompanyForNewSale();
    fireEvent.change(screen.getByLabelText('Origem do valor'), { target: { value: 'manual_amount' } });
    fireEvent.change(screen.getByLabelText('Data comercial (UTC)'), { target: { value: '2020-01-02T03:04' } });
    fireEvent.change(screen.getByLabelText('Valor em reais'), { target: { value: '120,50' } });
    fireEvent.change(screen.getByLabelText(/Descrição \/ motivo/), { target: { value: 'Ajuste autorizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar venda manual' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Conexão interrompida.');
    fireEvent.click(screen.getByRole('button', { name: 'Registrar venda manual' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('A API continua indisponível.'));

    fireEvent.change(screen.getByLabelText('Valor em reais'), { target: { value: '151,25' } });
    fireEvent.change(screen.getByLabelText(/Descrição \/ motivo/), { target: { value: 'Descrição atualizada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar venda manual' }));

    expect(await screen.findByRole('heading', { name: 'Venda registrada.' })).toBeInTheDocument();
    const calls = vi.mocked(createManualSale).mock.calls.map(([input]) => input);
    expect(calls).toHaveLength(3);
    expect(calls[0]).toEqual({
      companyId: company.id,
      soldAt: '2020-01-02T03:04:00.000Z',
      pricingMode: 'manual_amount',
      amount: '120.50',
      description: 'Ajuste autorizado',
      operationId: firstOperationId,
    });
    expect(calls[1]).toEqual(calls[0]);
    expect(calls[2]).toEqual({
      companyId: company.id,
      soldAt: '2020-01-02T03:04:00.000Z',
      pricingMode: 'manual_amount',
      amount: '151.25',
      description: 'Descrição atualizada',
      operationId: secondOperationId,
    });
    const result = screen.getByRole('region', { name: 'Venda registrada' });
    expect(result).toHaveTextContent('151,25');
    expect(result).toHaveTextContent('2024-11-02T13:45:00.000Z UTC');
  });

  it('filtra por origem, empresa e datas UTC e pagina mantendo os filtros', async () => {
    const filteredSale = { ...sale, id: 'sale-filtered', description: 'Venda filtrada' };
    const secondPageSale = { ...sale, id: 'sale-page-2', description: 'Venda da página 2' };
    vi.mocked(getPlatformSales).mockImplementation(async query => {
      if (!query) return pageResult([sale], 1, 20, 55, 3);
      if (query.page === 2) return pageResult([secondPageSale], 2, 20, 25, 2);
      if (query.origin === 'manual' && query.from) return pageResult([filteredSale], 1, 20, 25, 2);
      return pageResult([sale], 1, 20, 55, 3);
    });

    renderSalesRoutes();
    expect(await screen.findByRole('link', { name: company.nome })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toHaveTextContent('Página 1 de 3');
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Plano'), { target: { value: plan.id } });
    fireEvent.change(screen.getByLabelText('Origem'), { target: { value: 'manual' } });
    fireEvent.change(screen.getByLabelText('De (UTC)'), { target: { value: '2025-03-01T08:30' } });
    fireEvent.change(screen.getByLabelText('Até (UTC)'), { target: { value: '2025-03-31T18:45' } });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));
    await waitFor(() => expect(getPlatformSales).toHaveBeenCalledWith({
      companyId: '',
      planId: plan.id,
      origin: 'manual',
      from: '2025-03-01T08:30:00.000Z',
      to: '2025-03-31T18:45:00.000Z',
      page: 1,
    }));
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toHaveTextContent('Página 1 de 2');

    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por empresa' }));
    fireEvent.click(await screen.findByRole('button', { name: /Empresa de Exemplo/ }));
    await waitFor(() => expect(getPlatformSales).toHaveBeenCalledWith({
      companyId: company.id,
      planId: plan.id,
      origin: 'manual',
      from: '2025-03-01T08:30:00.000Z',
      to: '2025-03-31T18:45:00.000Z',
      page: 1,
    }));
    expect(screen.getByText('Empresa de Exemplo', { selector: 'span' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText('Venda da página 2')).toBeInTheDocument();
    expect(getPlatformSales).toHaveBeenLastCalledWith({
      companyId: company.id,
      planId: plan.id,
      origin: 'manual',
      from: '2025-03-01T08:30:00.000Z',
      to: '2025-03-31T18:45:00.000Z',
      page: 2,
    });
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();
  });

  it('distingue falha de lista vazia e oferece nova tentativa', async () => {
    vi.mocked(getPlatformSales)
      .mockRejectedValueOnce(new Error('Consulta de vendas indisponível.'))
      .mockResolvedValueOnce(pageResult([], 1, 20, 0, 0));

    renderSalesRoutes();

    expect(await screen.findByRole('alert')).toHaveTextContent('Consulta de vendas indisponível.');
    expect(screen.queryByText('Nenhuma venda encontrada.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Nenhuma venda encontrada.')).toBeInTheDocument();
    expect(getPlatformSales).toHaveBeenCalledTimes(2);
  });

  it('confirma exclusão definitiva sem editar venda nem alterar a empresa', async () => {
    vi.mocked(getPlatformSales)
      .mockResolvedValueOnce(pageResult([sale]))
      .mockResolvedValueOnce(pageResult([], 1, 20, 0, 0));

    renderSalesRoutes();

    expect(await screen.findByRole('link', { name: company.nome })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir definitivamente' }));

    const dialog = screen.getByRole('dialog', { name: 'Excluir venda definitivamente' });
    expect(dialog).toHaveTextContent('A empresa e o plano serão preservados.');
    expect(dialog).toHaveTextContent('A correção exige novo lançamento manual.');
    expect(deletePlatformSale).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('Nenhuma venda encontrada.')).toBeInTheDocument();
    expect(deletePlatformSale).toHaveBeenCalledWith(sale.id);
    expect(screen.getByRole('status')).toHaveTextContent('Venda excluída definitivamente.');
    expect(screen.getByRole('link', { name: 'Fazer novo lançamento' })).toHaveAttribute('href', '/dashboard/super-admin/sales/new');
    expect(createManualSale).not.toHaveBeenCalled();
    expect(updatePlatformCompany).not.toHaveBeenCalled();
  });
});
