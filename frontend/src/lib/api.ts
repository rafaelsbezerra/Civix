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
export type PlanInput = Omit<Plan, 'id'>;
export interface InitialSale {
  id: string; companyId: string; planId: string; planName: string;
  amount: string; currency: 'BRL'; soldAt: string; createdAt: string;
}
export interface CompanyRegistrationResult {
  company: Empresa & { plan_id: string }; sale: InitialSale; replayed: boolean;
}
export type CompanyRegistrationInput = Pick<Empresa, 'nome' | 'cnpj' | 'descricao' | 'descricao_detalhada' | 'categoria' | 'cidade' | 'estado' | 'tamanho'>
  & Partial<Pick<Empresa, 'email' | 'telefone' | 'endereco' | 'website' | 'whatsapp'>> & { planId: string; operationId: string };

function authenticatedOptions(method = 'GET', body?: unknown): RequestInit {
  // const token = localStorage.getItem('token');
  // if (!token) throw new ApiError('Faça login para continuar.', 401);
  // return { method, headers: { Authorization: `Bearer ${token}` }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) };
  return { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) };
}
function requirePlanResponse(value: Plan): Plan {
  if (!value || typeof value.id !== 'string' || typeof value.price !== 'string'
    || typeof value.name !== 'string' || typeof value.slug !== 'string' || typeof value.isActive !== 'boolean'
    || !Array.isArray(value.features) || !value.limits) throw new ApiError('A API retornou um plano inválido.');
  return value;
}
export async function getPlatformPlans(): Promise<Plan[]> {
  const result = (await fetchApi<Plan[]>('/api/v1/platform/plans', authenticatedOptions())).data;
  if (!Array.isArray(result)) throw new ApiError('A API retornou uma lista de planos inválida.');
  return result.map(requirePlanResponse);
}
export async function savePlatformPlan(input: PlanInput, id?: string): Promise<Plan> {
  return requirePlanResponse((await fetchApi<Plan>(`/api/v1/platform/plans${id ? '/' + encodeURIComponent(id) : ''}`,
    authenticatedOptions(id ? 'PUT' : 'POST', input))).data);
}
export async function setPlatformPlanActive(id: string, active: boolean): Promise<Plan> {
  return requirePlanResponse((await fetchApi<Plan>(`/api/v1/platform/plans/${encodeURIComponent(id)}/activation`,
    authenticatedOptions('POST', { active }))).data);
}
export async function registerCompany(input: CompanyRegistrationInput): Promise<CompanyRegistrationResult> {
  const result = (await fetchApi<CompanyRegistrationResult>('/api/v1/platform/companies', authenticatedOptions('POST', input))).data;
  if (!result?.company?.id || !result.sale?.id || typeof result.sale.amount !== 'string'
    || result.sale.companyId !== result.company.id) throw new ApiError('A API retornou um cadastro inválido.');
  return result;
}
export async function updateOwnProfile(input: { name: string; email: string }): Promise<{ user: LoginResult['user']; requiresLogin: boolean }> {
  const result = (await fetchApi<{ user: LoginResult['user']; requiresLogin: boolean }>('/api/v1/users/profile', authenticatedOptions('PUT', input))).data;
  if (!result?.user?.id || typeof result.user.email !== 'string' || typeof result.requiresLogin !== 'boolean') throw new ApiError('A API retornou um perfil inválido.');
  return result;
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
    // response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError('Não foi possível conectar à API. Tente novamente.');
  }

  let payload: unknown;

  if (response.status === 204 && response.ok) return { data: undefined as T };

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

export type CompanyImagePurpose = 'logo' | 'cover';
export interface CompanyImageUpload {
  imageId: string;
  target: { module: 'companies'; resourceId: string; purpose: CompanyImagePurpose };
}
export async function uploadCompanyImage(companyId: string, purpose: CompanyImagePurpose, file: File): Promise<CompanyImageUpload> {
  const body = new FormData();
  body.append('file', file);
  body.append('module', 'companies');
  body.append('resourceId', companyId);
  body.append('purpose', purpose);
  const result = (await fetchApi<CompanyImageUpload>('/api/v1/storage/images', { ...authenticatedOptions('POST'), body })).data;
  if (!result?.imageId || result.target?.module !== 'companies' || result.target.resourceId !== companyId || result.target.purpose !== purpose) {
    throw new ApiError('A API retornou um upload inválido.');
  }
  return result;
}
export async function getCompanyImageUrl(imageId: string): Promise<string> {
  const result = (await fetchApi<{ url: string; expiresInSeconds: number }>('/api/v1/storage/images/' + encodeURIComponent(imageId) + '/url')).data;
  if (typeof result?.url !== 'string' || result.expiresInSeconds !== 300) throw new ApiError('A API retornou uma URL de imagem inválida.');
  return result.url;
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
  // const token = localStorage.getItem('token');

  const response = await fetchApi<Plan>('/api/v1/plans/selection', {
    method: 'POST',
    // headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  // token: string;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const response = await fetchApi<LoginResult>('/api/v1/users/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const result = response.data;

  if (!result || !result.user || (typeof result.user.id !== 'string' && typeof result.user.id !== 'number')
    || (result.user.name != null && typeof result.user.name !== 'string') || typeof result.user.email !== 'string'
    || !['admin_empresa', 'super_admin', 'atendente'].includes(result.user.role)
    || (result.user.role === 'super_admin' ? result.user.companyId !== null : typeof result.user.companyId !== 'string' || !result.user.companyId)) {
    throw new ApiError('A API retornou uma resposta de login inválida.');
  }

  return result;
}

export type AuthenticatedRole = 'admin_empresa' | 'super_admin' | 'atendente';


export interface SessionProfile {
  user: LoginResult['user'];
  permissions: { uploadCompanyCover: boolean };
}

export async function getSessionProfile(): Promise<SessionProfile> {
  // const token = localStorage.getItem('token');
  // if (!token) throw new ApiError('Faça login para continuar.', 401);
  const response = await fetchApi<SessionProfile>('/api/v1/users/profile', {
    // headers: { Authorization: 'Bearer ' + token },
  });
  const profile = response.data;
  if (!profile?.user || !['admin_empresa', 'super_admin', 'atendente'].includes(profile.user.role)
    || typeof profile.permissions?.uploadCompanyCover !== 'boolean'
    || (profile.user.role === 'super_admin' ? profile.user.companyId !== null : typeof profile.user.companyId !== 'string' || !profile.user.companyId)) {
    throw new ApiError('Sessão inválida.', 401);
  }
  return profile;
}

export async function logout(): Promise<void> {
  await fetchApi('/api/v1/users/logout', { method: 'POST' });
}

export interface PaginationMeta { page: number; pageSize: number; total: number; totalPages: number }
export interface PageResult<T> { data: T[]; meta: PaginationMeta }
export interface PlatformCompany extends Empresa {
  plan_id?: string | null; deleted_at?: string | null;
  deactivation_reason?: string | null; deactivated_at?: string | null;
}
function requirePlatformCompany(value: PlatformCompany): PlatformCompany {
  if (!value || typeof value.id !== 'string' || typeof value.nome !== 'string'
    || !['ativo', 'inativo', 'verificado'].includes(value.status)) throw new ApiError('Empresa inválida na resposta.');
  return value;
}
function requirePage<T>(result: ApiResponse<T[]>, validate: (value: T) => T): PageResult<T> {
  const meta = result.meta as unknown as PaginationMeta;
  if (!Array.isArray(result.data) || !meta || !Number.isInteger(meta.page) || meta.page < 1
    || !Number.isInteger(meta.pageSize) || meta.pageSize < 1 || !Number.isInteger(meta.total)
    || meta.total < 0 || !Number.isInteger(meta.totalPages) || meta.totalPages < 0) throw new ApiError('Paginação inválida na resposta.');
  return { data: result.data.map(validate), meta };
}
export async function getPlatformCompanies(query: { page?: number; limit?: number; q?: string; status?: string; planId?: string } = {}): Promise<PageResult<PlatformCompany>> {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)]));
  return requirePage(await fetchApi<PlatformCompany[]>('/api/v1/platform/companies?' + params, authenticatedOptions()), requirePlatformCompany);
}
export async function getPlatformCompany(id: string): Promise<PlatformCompany> {
  return requirePlatformCompany((await fetchApi<PlatformCompany>('/api/v1/platform/companies/' + encodeURIComponent(id), authenticatedOptions())).data);
}
export async function updatePlatformCompany(id: string, input: Omit<CompanyRegistrationInput, 'operationId'>): Promise<PlatformCompany> {
  return requirePlatformCompany((await fetchApi<PlatformCompany>('/api/v1/platform/companies/' + encodeURIComponent(id), authenticatedOptions('PUT', input))).data);
}
export async function changePlatformCompanyState(id: string, action: 'suspension' | 'reactivation' | 'restoration' | 'archive', reason?: string): Promise<void> {
  await fetchApi('/api/v1/platform/companies/' + encodeURIComponent(id) + (action === 'archive' ? '' : '/' + action),
    authenticatedOptions(action === 'archive' ? 'DELETE' : 'POST', reason === undefined ? {} : { reason }));
}

export interface PlatformSale {
  id: string; companyId: string; companyName?: string; planId: string | null; planName: string | null;
  origin: 'company_creation' | 'manual'; pricingMode: 'company_plan' | 'manual_amount';
  planPrice: string | null; planBillingPeriod: BillingPeriod | null;
  amount: string; currency: 'BRL'; description: string | null;
  soldAt: string; createdAt: string; createdBy: string;
}
export type ManualSaleDraft = { companyId: string; soldAt: string } &
  ({ pricingMode: 'company_plan'; description?: string } | { pricingMode: 'manual_amount'; amount: string; description: string });
export type ManualSaleInput = ManualSaleDraft & { operationId: string };
function requireSale(value: PlatformSale): PlatformSale {
  if (!value || typeof value.id !== 'string' || typeof value.companyId !== 'string' || typeof value.amount !== 'string'
    || value.currency !== 'BRL' || !['company_creation', 'manual'].includes(value.origin)
    || !['company_plan', 'manual_amount'].includes(value.pricingMode) || !Number.isFinite(Date.parse(value.soldAt))) throw new ApiError('Venda inválida na resposta.');
  return value;
}
export async function getPlatformSales(query: { companyId?: string; planId?: string; origin?: string; from?: string; to?: string; page?: number; limit?: number } = {}): Promise<PageResult<PlatformSale>> {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)]));
  return requirePage(await fetchApi<PlatformSale[]>('/api/v1/platform/sales?' + params, authenticatedOptions()), requireSale);
}
export async function getPlatformSale(id: string): Promise<PlatformSale> {
  return requireSale((await fetchApi<PlatformSale>('/api/v1/platform/sales/' + encodeURIComponent(id), authenticatedOptions())).data);
}
export async function createManualSale(input: ManualSaleInput): Promise<{ sale: PlatformSale; replayed: boolean }> {
  const result = (await fetchApi<{ sale: PlatformSale; replayed: boolean }>('/api/v1/platform/sales', authenticatedOptions('POST', input))).data;
  if (!result || typeof result.replayed !== 'boolean') throw new ApiError('Resultado de venda inválido.');
  return { ...result, sale: requireSale(result.sale) };
}
export async function deletePlatformSale(id: string): Promise<void> {
  await fetchApi('/api/v1/platform/sales/' + encodeURIComponent(id), authenticatedOptions('DELETE'));
}

export interface ManagedUser {
  id: string | number; name: string; email: string; role: AuthenticatedRole; status: 'active' | 'pending' | 'blocked';
  companyId: string | null; deactivationReason: string | null; invitationStatus: 'accepted' | 'pending' | 'invalidated';
}
export interface ManagedUserInput { name: string; email: string; role?: 'admin_empresa' | 'atendente' }
function userAdministrationPath(companyId: string | null) {
  return companyId === null ? '/api/v1/platform/administrators' : '/api/v1/platform/companies/' + encodeURIComponent(companyId) + '/users';
}
function requireManagedUser(user: ManagedUser): ManagedUser {
  if (!user || !['string', 'number'].includes(typeof user.id) || typeof user.email !== 'string'
    || !['super_admin', 'admin_empresa', 'atendente'].includes(user.role) || !['active', 'pending', 'blocked'].includes(user.status)
    || !['accepted', 'pending', 'invalidated'].includes(user.invitationStatus)) throw new ApiError('Usuário inválido na resposta.');
  return user;
}
export async function getManagedUsers(companyId: string | null, query: { q?: string; role?: string; status?: string; page?: number; limit?: number } = {}): Promise<PageResult<ManagedUser>> {
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)]));
  return requirePage(await fetchApi<ManagedUser[]>(userAdministrationPath(companyId) + '?' + params, authenticatedOptions()), requireManagedUser);
}
export async function inviteManagedUser(companyId: string | null, input: ManagedUserInput): Promise<ManagedUser> {
  const response = await fetchApi<{ user: ManagedUser; message: string }>(userAdministrationPath(companyId) + '/invitations', authenticatedOptions('POST', input));
  return requireManagedUser(response.data?.user);
}
export async function updateManagedUser(companyId: string | null, id: string | number, input: ManagedUserInput): Promise<ManagedUser> {
  return requireManagedUser((await fetchApi<ManagedUser>(userAdministrationPath(companyId) + '/' + encodeURIComponent(String(id)), authenticatedOptions('PUT', input))).data);
}
export async function changeManagedUserState(companyId: string | null, id: string | number, action: 'suspension' | 'reactivation' | 'delete', reason?: string): Promise<ManagedUser | undefined> {
  const response = await fetchApi<ManagedUser>(userAdministrationPath(companyId) + '/' + encodeURIComponent(String(id)) + (action === 'delete' ? '' : '/' + action), authenticatedOptions(action === 'delete' ? 'DELETE' : 'POST', reason === undefined ? {} : { reason }));
  return action === 'delete' ? undefined : requireManagedUser(response.data);
}
