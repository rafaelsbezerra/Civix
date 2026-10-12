/**
 * Consumidores HTTP do frontend para os contratos atuais do backend.
 */
export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  descricao: string;
  descricao_detalhada: string;
  categoria: string;
  logo?: string | null;
  cidade: string;
  estado: string;
  endereco?: string | null;
  telefone?: string | null;
  email?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  status: 'ativo' | 'inativo' | 'verificado';
  data_cadastro?: string;
  verificado: boolean;
  tamanho: 'pequena' | 'media' | 'grande';
  descritivo?: string | null;
  tone?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export type BillingPeriod = 'monthly' | 'yearly' | 'one_time';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  billingPeriod: BillingPeriod;
  features: string[];
  limits: Record<string, number | string | boolean>;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';
// Aceitar a origem e a configuração anterior com prefixo de API.
const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, '').replace(/\/api(?:\/v1)?$/, '');

function getResponseMessage(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object' && 'message' in payload
    && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  return undefined;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('Accept', 'application/json');

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError('Não foi possível conectar à API. Tente novamente.');
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      response.ok ? 'A API retornou uma resposta inválida.' : 'Não foi possível concluir a requisição.',
      response.status,
    );
  }

  if (!response.ok) {
    throw new ApiError(getResponseMessage(payload) || 'Não foi possível concluir a requisição.', response.status);
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !('data' in payload)) {
    throw new ApiError('A API retornou uma resposta inválida.', response.status);
  }

  return (payload as ApiResponse<T>).data;
}

export const fetchEmpresas = (): Promise<Empresa[]> => {
  return fetchApi<Empresa[]>('/api/v1/empresas');
};

export const fetchEmpresaById = (id: string): Promise<Empresa> => {
  return fetchApi<Empresa>(`/api/v1/empresas/${encodeURIComponent(id)}`);
};

export const fetchEmpresasByCategoria = (categoria: string): Promise<Empresa[]> => {
  return fetchApi<Empresa[]>(`/api/v1/empresas/categoria/${encodeURIComponent(categoria)}`);
};

export const fetchEmpresasVerificadas = (): Promise<Empresa[]> => {
  return fetchApi<Empresa[]>('/api/v1/empresas/verificadas/todas');
};

export const fetchEmpresasByEstado = (estado: string): Promise<Empresa[]> => {
  return fetchApi<Empresa[]>(`/api/v1/empresas/estado/${encodeURIComponent(estado)}`);
};

export const fetchEmpresasByTamanho = (tamanho: 'pequena' | 'media' | 'grande'): Promise<Empresa[]> => {
  return fetchApi<Empresa[]>(`/api/v1/empresas/tamanho/${tamanho}`);
};

export const searchEmpresas = (termo: string): Promise<Empresa[]> => {
  const params = new URLSearchParams({ q: termo });

  return fetchApi<Empresa[]>(`/api/v1/empresas/buscar?${params.toString()}`);
};

export const fetchPlans = (): Promise<Plan[]> => {
  return fetchApi<Plan[]>('/api/v1/plans');
};

export const selectPlan = (planId: string): Promise<Plan> => {
  const token = localStorage.getItem('token');

  return fetchApi<Plan>('/api/v1/plans/selection', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ planId }),
  });
};

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return fetchApi('/api/v1/users/esqueci-senha', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return fetchApi('/api/v1/users/redefinir-senha', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export function validateInviteToken(token: string, signal?: AbortSignal): Promise<{ email: string }> {
  const params = new URLSearchParams({ token });

  return fetchApi(`/api/auth/validate-token?${params.toString()}`, { signal });
}

export function completeFirstAccess(token: string, password: string): Promise<{ message: string }> {
  return fetchApi('/api/auth/first-access', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}
