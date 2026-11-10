import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Overview from './Overview';
import * as api from '../../lib/api';

vi.mock('../../lib/api', async (original) => ({
  ...(await original<typeof import('../../lib/api')>()),
  getPlatformOverviewSales: vi.fn(),
  getPlatformOverviewCompanies: vi.fn(),
  getPlatformUsersMetrics: vi.fn(),
}));

// Mock ResponsiveContainer para evitar dimensões 0x0 do JSDOM
vi.mock('recharts', async (original) => {
  const actual = await original<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div
        data-testid="recharts-responsive-container"
        style={{ width: 400, height: 200 }}
      >
        {children}
      </div>
    ),
  };
});

const mockSession = {
  user: {
    id: 'super-1',
    name: 'Carlos Super',
    email: 'carlos@civix.test',
    role: 'super_admin' as const,
    companyId: null,
  },
  permissions: { uploadCompanyCover: true },
};

const mockOutletContext = {
  session: mockSession,
  setProfile: vi.fn(),
  handleError: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Erro')),
};

vi.mock('react-router-dom', async (original) => {
  const actual = await original<typeof import('react-router-dom')>();
  return {
    ...actual,
    useOutletContext: () => mockOutletContext,
  };
});

describe('Overview do Super Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza os 6 blocos de métricas e listas recentes com dados das APIs', async () => {
    vi.mocked(api.getPlatformOverviewSales).mockResolvedValue({
      totalRevenue: 2450.5,
      totalSalesCount: 8,
      currentMonthRevenue: 1200.0,
      currentMonthCount: 3,
      previousMonthRevenue: 850.0,
      previousMonthCount: 2,
      monthOverMonthPercent: 41,
      recentSales: [
        {
          id: 'sale-1',
          companyId: 'comp-1',
          companyName: 'Empresa Alpha',
          planId: 'plan-1',
          planName: 'Plano Pro',
          origin: 'company_creation',
          pricingMode: 'company_plan',
          planPrice: '500.00',
          planBillingPeriod: 'monthly',
          amount: '500.00',
          currency: 'BRL',
          description: null,
          soldAt: '2026-11-05T14:00:00.000Z',
          createdAt: '2026-11-05T14:00:00.000Z',
          createdBy: 'super-1',
        },
      ],
    });

    vi.mocked(api.getPlatformOverviewCompanies).mockResolvedValue({
      total: 15,
      active: 12,
      inactive: 2,
      archived: 1,
      recentCompanies: [
        {
          id: 'comp-1',
          nome: 'Empresa Alpha',
          cnpj: '11.222.333/0001-44',
          descricao: 'Descrição Alpha',
          descricao_detalhada: 'Detalhes Alpha',
          categoria: 'Engenharia',
          cidade: 'Fortaleza',
          estado: 'CE',
          status: 'ativo',
          verificado: true,
          tamanho: 'media',
          data_cadastro: '2026-11-01T10:00:00.000Z',
          createdAt: '2026-11-01T10:00:00.000Z',
          deleted_at: null,
        },
      ],
    });

    vi.mocked(api.getPlatformUsersMetrics).mockResolvedValue({
      total: 25,
      active: 20,
      pending: 4,
      blocked: 1,
      byRole: [
        { role: 'super_admin', total: 2, active: 2, pending: 0, blocked: 0 },
        { role: 'admin_empresa', total: 15, active: 13, pending: 2, blocked: 0 },
        { role: 'atendente', total: 8, active: 5, pending: 2, blocked: 1 },
      ],
    });

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>,
    );

    // 1. Saudação ao superadmin
    expect(screen.getByText(/Visão Geral Executiva/i)).toBeInTheDocument();
    expect(screen.getByText(/Carlos Super/i)).toBeInTheDocument();

    // 2. Receita Total Acumulada
    await waitFor(() => {
      expect(screen.getByText('Receita Total Acumulada')).toBeInTheDocument();
    });
    expect(screen.getByText(/Volume total de/i)).toBeInTheDocument();

    // 3. Faturamento no Mês Atual vs. Mês Anterior
    expect(screen.getByText(/\+41%/i)).toBeInTheDocument();
    expect(screen.getByText(/Comparativo Mensal/i)).toBeInTheDocument();

    // 4. Saúde da Base de Empresas
    expect(screen.getByText('Saúde da Base de Empresas')).toBeInTheDocument();
    expect(screen.getByText(/empresas no total/i)).toBeInTheDocument();
    expect(screen.getByText('Inativas / Suspensas')).toBeInTheDocument();

    // 5. Total de Usuários Gerenciados por Perfil
    expect(screen.getByText('Usuários Gerenciados por Perfil')).toBeInTheDocument();
    expect(screen.getByText(/usuários no total/i)).toBeInTheDocument();
    expect(screen.getByText(/ativos/i)).toBeInTheDocument();
    expect(screen.getByText(/aguardando/i)).toBeInTheDocument();

    // 6. Listas Recentes
    expect(screen.getByText('Últimas Vendas Registradas')).toBeInTheDocument();
    expect(screen.getAllByText('Empresa Alpha')).toHaveLength(2);
    expect(screen.getByText('Plano Pro')).toBeInTheDocument();

    expect(screen.getByText('Últimas Empresas Registradas')).toBeInTheDocument();
    expect(screen.getByText('Fortaleza - CE')).toBeInTheDocument();

    // 7. Ações rápidas
    expect(screen.getByText('Conecte uma nova empresa.')).toBeInTheDocument();
    expect(screen.getByText('Lançamento comercial.')).toBeInTheDocument();
    expect(screen.getByText('Organize sua oferta.')).toBeInTheDocument();
    expect(screen.getByText('Equipe gestora.')).toBeInTheDocument();
  });

  it('exibe mensagem e botão de retentativa se a busca de faturamento falhar', async () => {
    vi.mocked(api.getPlatformOverviewSales).mockRejectedValue(
      new Error('Falha de rede ao buscar vendas'),
    );
    vi.mocked(api.getPlatformOverviewCompanies).mockResolvedValue({
      total: 0,
      active: 0,
      inactive: 0,
      archived: 0,
      recentCompanies: [],
    });
    vi.mocked(api.getPlatformUsersMetrics).mockResolvedValue({
      total: 0,
      active: 0,
      pending: 0,
      blocked: 0,
      byRole: [],
    });

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Não foi possível carregar o faturamento/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /Tentar novamente/i }),
    ).toBeInTheDocument();
  });
});
