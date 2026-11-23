import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversationMessage, ConversationSummary, Empresa, Plan } from './api';

const company: Empresa = {
  id: 'empresa-1',
  nome: 'Empresa de teste',
  cnpj: '12345678000190',
  descricao: 'Resumo',
  descricao_detalhada: 'Descrição completa',
  categoria: 'Tecnologia',
  cidade: 'Fortaleza',
  estado: 'CE',
  status: 'ativo',
  verificado: false,
  tamanho: 'pequena',
  logo: null,
  telefone: null,
  data_cadastro: '2026-10-12T12:00:00.000Z',
};
const plan: Plan = {
  id: 'plano-1',
  name: 'Plano de teste',
  slug: 'teste',
  description: 'Descrição',
  price: '20.00',
  billingPeriod: 'monthly',
  features: ['Catálogo'],
  limits: {},
  isFeatured: false,
  isActive: true,
  displayOrder: 1,
};
const conversationMessage: ConversationMessage = {
  id: 'message-1',
  sender: 'customer',
  text: 'Preciso de ajuda.',
  createdAt: '2026-11-23T12:00:00.000Z',
};
const conversation: ConversationSummary = {
  id: 'conversation-1',
  customer: {
    name: 'João Pedroso',
    phone: '(11) 99999-0000',
    location: 'São Paulo, SP',
  },
  company: { name: 'Lume Interiores' },
  status: 'pending',
  assignee: { type: 'bot' },
  attention: false,
  unreadCount: 1,
  updatedAt: '2026-11-23T12:00:00.000Z',
  lastMessage: conversationMessage,
};
const fetchMock = vi.fn<typeof fetch>();

function respond(body: unknown, status = 200) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('Contratos dos consumidores de API', () => {
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

  it.each([
    ['https://backend.example.test', 'https://backend.example.test/api/v1/empresas'],
    ['https://backend.example.test/', 'https://backend.example.test/api/v1/empresas'],
    [
      'https://backend.example.test/api/v1',
      'https://backend.example.test/api/v1/empresas',
    ],
    [
      'https://backend.example.test/api/v1/',
      'https://backend.example.test/api/v1/empresas',
    ],
    ['/api/v1', '/api/v1/empresas'],
    ['', 'http://localhost:3000/api/v1/empresas'],
  ])(
    'Configuração %s usa o prefixo de API uma única vez',
    async (base, expectedUrl) => {
      vi.stubEnv('VITE_API_URL', base);
      respond({ data: [company], meta: { source: 'fixture' } });
      const { fetchEmpresas } = await import('./api');

      expect(await fetchEmpresas()).toEqual([company]);
      expect(fetchMock.mock.calls[0][0]).toBe(expectedUrl);
    },
  );

  it('Catálogo e detalhe preservam os campos snake_case e contatos nulos', async () => {
    respond({ data: [company] });
    respond({ data: company });
    const api = await import('./api');

    expect(await api.fetchEmpresas()).toEqual([company]);
    expect(await api.fetchEmpresaById(company.id)).toEqual(company);
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://backend.example.test/api/v1/empresas/empresa-1',
    );
  });

  it('Busca e filtros codificam os valores sem criar uma rota adicional', async () => {
    const api = await import('./api');
    const term = 'Ação + Saúde & Cia';

    for (let index = 0; index < 5; index++) {
      respond({ data: [company] });
    }
    await api.searchEmpresas(term);
    await api.fetchEmpresasByCategoria('Saúde/Serviços');
    await api.fetchEmpresasByEstado('CE');
    await api.fetchEmpresasByTamanho('pequena');

    const searched = new URL(String(fetchMock.mock.calls[0][0]));

    expect(searched.pathname).toBe('/api/v1/empresas/buscar');
    expect(searched.searchParams.get('q')).toBe(term);
    expect(searched.searchParams.size).toBe(1);
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://backend.example.test/api/v1/empresas/categoria/Sa%C3%BAde%2FServi%C3%A7os',
    );
    expect(fetchMock.mock.calls[2][0]).toBe(
      'https://backend.example.test/api/v1/empresas/estado/CE',
    );
    expect(fetchMock.mock.calls[3][0]).toBe(
      'https://backend.example.test/api/v1/empresas/tamanho/pequena',
    );
  });

  it.each([
    { status: 403, message: 'Acesso negado.' },
    {
      status: 400,
      message: 'Dados inválidos.',
      code: 'VALIDATION_ERROR',
      stack: 'pilha interna',
      details: { sql: 'diagnóstico interno' },
    },
  ])(
    'Erros HTTP mostram somente a mensagem pública no erro do consumidor',
    async (body) => {
      respond(body, body.status);
      const { fetchPlans, ApiError } = await import('./api');

      const result = await fetchPlans().catch((error) => error);

      expect(result).toBeInstanceOf(ApiError);
      expect(result.status).toBe(body.status);
      expect(result.message).toBe(body.message);
      expect(result.message).not.toContain('pilha interna');
      expect(result.message).not.toContain('diagnóstico interno');
    },
  );

  it('Não substitui erros de rede ou envelopes sem data por dados fictícios', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Falha simulada de rede'));
    const { fetchPlans } = await import('./api');

    await expect(fetchPlans()).rejects.toThrow();
    respond({ success: true });
    await expect(fetchPlans()).rejects.toThrow();
  });

  it('Lista planos e o helper existente envia seleção com Bearer e planId', async () => {
    const getItem = vi.fn(() => 'token-sintetico-de-teste');

    vi.stubGlobal('localStorage', { getItem });
    respond({ data: [plan] });
    respond({ data: plan });
    const api = await import('./api');

    expect(await api.fetchPlans()).toEqual([plan]);
    expect(await api.selectPlan(plan.id)).toEqual(plan);
    const [url, options] = fetchMock.mock.calls[1];

    expect(url).toBe('https://backend.example.test/api/v1/plans/selection');
    expect(options?.method).toBe('POST');
    expect(new Headers(options?.headers).get('Authorization')).toBe(
      'Bearer token-sintetico-de-teste',
    );
    expect(JSON.parse(String(options?.body))).toEqual({ planId: plan.id });
    expect(getItem).toHaveBeenCalledWith('token');
  });

  it('Recuperação e redefinição usam os endpoints atuais com envelope data', async () => {
    respond({ data: { message: 'Instruções enviadas.' } });
    respond({ data: { message: 'Senha atualizada.' } });
    const api = await import('./api');

    await api.requestPasswordReset('pessoa@example.test');
    await api.resetPassword('token-sintetico', 'senha-teste-123');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://backend.example.test/api/v1/users/esqueci-senha',
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: 'pessoa@example.test',
    });
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://backend.example.test/api/v1/users/redefinir-senha',
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      token: 'token-sintetico',
      password: 'senha-teste-123',
    });
  });

  it('Primeiro acesso usa /api/auth e codifica o convite com cancelamento', async () => {
    vi.stubEnv('VITE_API_URL', 'https://backend.example.test/api/v1/');
    respond({ data: { email: 'pessoa@example.test' } });
    respond({ data: { message: 'Conta ativada.' } });
    const api = await import('./api');
    const token = 'convite+com/barra?x=1&outro=2';
    const controller = new AbortController();

    expect(await api.validateInviteToken(token, controller.signal)).toEqual({
      email: 'pessoa@example.test',
    });
    await api.completeFirstAccess(token, 'senha-teste-123');
    const validateUrl = new URL(String(fetchMock.mock.calls[0][0]));

    expect(validateUrl.pathname).toBe('/api/auth/validate-token');
    expect(validateUrl.searchParams.get('token')).toBe(token);
    expect(validateUrl.searchParams.size).toBe(1);
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://backend.example.test/api/auth/first-access',
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      token,
      password: 'senha-teste-123',
    });
  });
  it.each(['admin_empresa', 'super_admin', 'atendente'] as const)(
    'Login %s extrai token e usuário do envelope',
    async (role) => {
      const input = { email: 'pessoa@example.test', role, password: 'senha-teste' };
      const result = {
        user: {
          id: 'user-1',
          name: 'Teste',
          email: input.email,
          role,
          companyId: role === 'super_admin' ? null : 'company-1',
        },
        token: 'token-sintetico',
      };
      respond({ data: result });
      const { login } = await import('./api');
      expect(await login(input)).toEqual(result);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://backend.example.test/api/v1/users/login',
      );
      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(input);
    },
  );

  it('Login apresenta message público e rejeita token inválido, formato antigo e falha de rede', async () => {
    const { login } = await import('./api');
    const input = {
      email: 'pessoa@example.test',
      role: 'admin_empresa' as const,
      password: 'senha-teste',
    };
    respond(
      { status: 401, message: 'Credenciais inválidas', stack: 'diagnóstico privado' },
      401,
    );
    await expect(login(input)).rejects.toThrow('Credenciais inválidas');
    respond({ data: { token: '', user: {} } });
    await expect(login(input)).rejects.toThrow('resposta de login inválida');
    respond({ token: 'formato-antigo' });
    await expect(login(input)).rejects.toThrow('resposta inválida');
    fetchMock.mockRejectedValueOnce(new TypeError('Falha de rede'));
    await expect(login(input)).rejects.toThrow('Não foi possível conectar');
  });

  it('Lista conversas autorizadas com filtros e contagens do contrato proposto', async () => {
    respond({
      data: [conversation],
      meta: {
        total: 1,
        statusCounts: {
          all: 4,
          pending: 1,
          in_progress: 2,
          completed: 1,
        },
      },
    });
    const api = await import('./api');

    const result = await api.listConversations({
      status: 'pending',
      query: 'João & Cia',
    });
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));

    expect(requestUrl.pathname).toBe('/api/v1/company/conversations');
    expect(requestUrl.searchParams.get('status')).toBe('pending');
    expect(requestUrl.searchParams.get('q')).toBe('João & Cia');
    expect(result).toEqual({
      conversations: [conversation],
      total: 1,
      statusCounts: {
        all: 4,
        pending: 1,
        in_progress: 2,
        completed: 1,
      },
    });
  });

  it('Lê detalhes e mensagens e envia ações pelos métodos acordados para o frontend', async () => {
    const api = await import('./api');
    respond({ data: conversation });
    respond({ data: [conversationMessage] });
    respond({ data: conversationMessage });
    respond({ data: conversation });
    respond({ data: { ...conversation, status: 'completed' } });

    await api.getConversation(conversation.id);
    await api.getConversationMessages(conversation.id);
    await api.sendConversationMessage(conversation.id, 'Vou ajudar você.');
    await api.updateConversationAssignment(conversation.id, 'assume');
    await api.updateConversationStatus(conversation.id, 'completed');

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://backend.example.test/api/v1/company/conversations/conversation-1',
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://backend.example.test/api/v1/company/conversations/conversation-1/messages',
    );
    expect(fetchMock.mock.calls[2][1]?.method).toBe('POST');
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual({
      text: 'Vou ajudar você.',
    });
    expect(fetchMock.mock.calls[3][1]?.method).toBe('POST');
    expect(JSON.parse(String(fetchMock.mock.calls[3][1]?.body))).toEqual({
      action: 'assume',
    });
    expect(fetchMock.mock.calls[4][1]?.method).toBe('PATCH');
    expect(JSON.parse(String(fetchMock.mock.calls[4][1]?.body))).toEqual({
      status: 'completed',
    });
  });

  it('Rejeita DTO de conversa inválido em vez de renderizar dados incompletos', async () => {
    respond({
      data: [{ ...conversation, status: 'unknown' }],
      meta: {
        total: 1,
        statusCounts: {
          all: 1,
          pending: 0,
          in_progress: 0,
          completed: 0,
        },
      },
    });
    const { listConversations } = await import('./api');

    await expect(listConversations()).rejects.toThrow('conversa inválida');
  });
});
