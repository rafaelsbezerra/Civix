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
  cover_image_url?: string | null;
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

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
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

  return payload as ApiResponse<T>;
}

export const fetchEmpresas = async (): Promise<Empresa[]> => {
  const response = await fetchApi<Empresa[]>('/api/v1/empresas');
  return response.data;
};

export const fetchEmpresaById = async (id: string): Promise<Empresa> => {
  const response = await fetchApi<Empresa>(`/api/v1/empresas/${encodeURIComponent(id)}`);
  return response.data;
};

export const fetchEmpresasByCategoria = async (categoria: string): Promise<Empresa[]> => {
  const response = await fetchApi<Empresa[]>(`/api/v1/empresas/categoria/${encodeURIComponent(categoria)}`);
  return response.data;
};

export const fetchEmpresasVerificadas = async (): Promise<Empresa[]> => {
  const response = await fetchApi<Empresa[]>('/api/v1/empresas/verificadas/todas');
  return response.data;
};

export const fetchEmpresasByEstado = async (estado: string): Promise<Empresa[]> => {
  const response = await fetchApi<Empresa[]>(`/api/v1/empresas/estado/${encodeURIComponent(estado)}`);
  return response.data;
};

export const fetchEmpresasByTamanho = async (tamanho: 'pequena' | 'media' | 'grande'): Promise<Empresa[]> => {
  const response = await fetchApi<Empresa[]>(`/api/v1/empresas/tamanho/${tamanho}`);
  return response.data;
};

export const searchEmpresas = async (termo: string): Promise<Empresa[]> => {
  const params = new URLSearchParams({ q: termo });

  const response = await fetchApi<Empresa[]>(`/api/v1/empresas/buscar?${params.toString()}`);
  return response.data;
};

export const fetchPlans = async (): Promise<Plan[]> => {
  const response = await fetchApi<Plan[]>('/api/v1/plans');
  return response.data;
};

export const selectPlan = async (planId: string): Promise<Plan> => {
  const token = localStorage.getItem('token');

  const response = await fetchApi<Plan>('/api/v1/plans/selection', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ planId }),
  });
  return response.data;
};

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await fetchApi<{ message: string }>('/api/v1/users/esqueci-senha', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return response.data;
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const response = await fetchApi<{ message: string }>('/api/v1/users/redefinir-senha', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
  return response.data;
}

export async function validateInviteToken(token: string, signal?: AbortSignal): Promise<{ email: string }> {
  const params = new URLSearchParams({ token });

  const response = await fetchApi<{ email: string }>(`/api/auth/validate-token?${params.toString()}`, { signal });
  return response.data;
}

export async function completeFirstAccess(token: string, password: string): Promise<{ message: string }> {
  const response = await fetchApi<{ message: string }>('/api/auth/first-access', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
  return response.data;
}

export interface LoginInput {
  email: string;
  password?: string;
  role?: 'admin_empresa' | 'super_admin' | 'atendente';
}

export interface LoginResult {
  user: { id: string | number; name?: string; email: string; role: 'admin_empresa' | 'super_admin' | 'atendente'; companyId: string | null };
  token: string;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const response = await fetchApi<LoginResult>('/api/v1/users/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const result = response.data;

  if (!result || typeof result.token !== 'string' || !result.token.trim()
    || !result.user || (typeof result.user.id !== 'string' && typeof result.user.id !== 'number')
    || (result.user.name != null && typeof result.user.name !== 'string') || typeof result.user.email !== 'string'
    || !['admin_empresa', 'super_admin', 'atendente'].includes(result.user.role)
    || (result.user.role === 'super_admin' ? result.user.companyId !== null : typeof result.user.companyId !== 'string' || !result.user.companyId)) {
    throw new ApiError('A API retornou uma resposta de login inválida.');
  }

  return result;
}

export type AuthenticatedRole = 'admin_empresa' | 'super_admin' | 'atendente';

export async function requestClientAccess(email: string): Promise<void> {
  await fetchApi<unknown>('/api/v1/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, role: 'cliente' }),
  });
  // Cliente não deve receber nem armazenar sessão, mesmo em resposta inesperada.
  throw new ApiError('A API retornou uma resposta inesperada para o acesso de cliente.');
}

export interface SessionProfile {
  user: LoginResult['user'];
  permissions: { uploadCompanyCover: boolean };
}

export async function getSessionProfile(): Promise<SessionProfile> {
  const token = localStorage.getItem('token');
  if (!token) throw new ApiError('Faça login para continuar.', 401);
  const response = await fetchApi<SessionProfile>('/api/v1/users/profile', {
    headers: { Authorization: 'Bearer ' + token },
  });
  const profile = response.data;
  if (!profile?.user || !['admin_empresa', 'super_admin', 'atendente'].includes(profile.user.role)
    || typeof profile.permissions?.uploadCompanyCover !== 'boolean'
    || (profile.user.role === 'super_admin' ? profile.user.companyId !== null : typeof profile.user.companyId !== 'string' || !profile.user.companyId)) {
    throw new ApiError('Sessão inválida.', 401);
  }
  return profile;
}
