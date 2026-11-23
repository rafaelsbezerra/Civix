import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const plans = ['Inicial', 'Pro', 'Sem empresas'].map((name, index) => ({
  id: String(index + 1),
  name,
  slug: 'plano-' + index,
  description: '',
  price: '59.90',
  billingPeriod: 'monthly',
  features: [],
  limits: {},
  isFeatured: false,
  isActive: true,
  displayOrder: index,
}));
const companies = Array.from({ length: 101 }, (_, index) => ({
  id: 'company-' + index,
  nome: 'Empresa ' + index,
  status: index === 0 ? 'inativo' : index === 2 ? 'verificado' : 'ativo',
  deleted_at: index === 1 ? '2026-11-01T00:00:00Z' : null,
  plan_id: index === 100 ? null : index < 50 ? '1' : '2',
}));
const fetchMock = vi.fn<typeof fetch>();
function configure(rows = companies, failSecondPage = false) {
  fetchMock.mockImplementation(async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/plans')) {
      return Response.json({ data: plans });
    }
    expect(url.pathname).toBe('/api/v1/platform/companies');
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.has('status')).toBe(false);
    expect(url.searchParams.has('planId')).toBe(false);
    expect(url.searchParams.get('limit')).toBe('100');
    const page = Number(url.searchParams.get('page'));
    if (failSecondPage && page === 2) {
      return Response.json({ message: 'Falha na segunda página.' }, { status: 500 });
    }
    return Response.json({
      data: rows.slice((page - 1) * 100, page * 100),
      meta: {
        page,
        pageSize: 100,
        total: rows.length,
        totalPages: Math.ceil(rows.length / 100),
      },
    });
  });
}
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_API_URL', 'https://backend.example.test');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Métricas calculadas no frontend com a listagem existente', () => {
  it('usa todas as páginas e calcula length por plano sem chamar rota de métricas', async () => {
    configure();
    const { getPlatformCompanyMetrics } = await import('./api');
    const result = await getPlatformCompanyMetrics();
    expect(result).toEqual({
      total: 101,
      active: 99,
      inactive: 1,
      archived: 1,
      byPlan: [
        { planId: '1', planName: 'Inicial', count: 50 },
        { planId: '2', planName: 'Pro', count: 50 },
        { planId: '3', planName: 'Sem empresas', count: 0 },
        { planId: null, planName: 'Sem plano', count: 1 },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('retorna zero somente quando o array realmente está vazio', async () => {
    configure([]);
    const { getPlatformCompanyMetrics } = await import('./api');
    expect(await getPlatformCompanyMetrics()).toEqual({
      total: 0,
      active: 0,
      inactive: 0,
      archived: 0,
      byPlan: plans.map((plan) => ({ planId: plan.id, planName: plan.name, count: 0 })),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('não apresenta contagens parciais quando falha uma página', async () => {
    configure(companies, true);
    const { getPlatformCompanyMetrics } = await import('./api');
    await expect(getPlatformCompanyMetrics()).rejects.toThrow(
      'Falha na segunda página.',
    );
  });
});
