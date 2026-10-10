/**
 * Serviço de API do Frontend
 * Consumo dos endpoints de empresas do backend
 */

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  descricao: string;
  descricaoDetalhada: string;
  categoria: string;
  logo?: string;
  cidade: string;
  estado: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  status: 'ativo' | 'inativo' | 'verificado';
  dataCadastro: string;
  verificado: boolean;
  tamanho: 'pequena' | 'media' | 'grande';
  descritivo?: string;
  tone?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Função utilitária para lidar com requisições e tratamento de erros HTTP/JSON
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error || data.message || 'Erro ao processar requisição');
  }

  if (data.data === undefined) {
    throw new Error('Nenhum dado retornado pela API');
  }

  return data.data;
}

/**
 * Busca todas as empresas
 */
export const fetchEmpresas = async (): Promise<Empresa[]> => {
  try {
    return await fetchApi<Empresa[]>('/empresas');
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    throw error;
  }
};

/**
 * Busca uma empresa específica pelo ID
 */
export const fetchEmpresaById = async (id: string): Promise<Empresa> => {
  try {
    return await fetchApi<Empresa>(`/empresas/${id}`);
  } catch (error) {
    console.error(`Erro ao buscar empresa ${id}:`, error);
    throw error;
  }
};

/**
 * Busca empresas por categoria
 */
export const fetchEmpresasByCategoria = async (categoria: string): Promise<Empresa[]> => {
  try {
    return await fetchApi<Empresa[]>(`/empresas/categoria/${encodeURIComponent(categoria)}`);
  } catch (error) {
    console.error(`Erro ao buscar empresas da categoria ${categoria}:`, error);
    throw error;
  }
};

/**
 * Busca empresas verificadas
 */
export const fetchEmpresasVerificadas = async (): Promise<Empresa[]> => {
  try {
    return await fetchApi<Empresa[]>('/empresas/verificadas/todas');
  } catch (error) {
    console.error('Erro ao buscar empresas verificadas:', error);
    throw error;
  }
};

/**
 * Busca empresas por estado
 */
export const fetchEmpresasByEstado = async (estado: string): Promise<Empresa[]> => {
  try {
    return await fetchApi<Empresa[]>(`/empresas/estado/${encodeURIComponent(estado)}`);
  } catch (error) {
    console.error(`Erro ao buscar empresas do estado ${estado}:`, error);
    throw error;
  }
};

/**
 * Busca empresas por tamanho
 */
export const fetchEmpresasByTamanho = async (
  tamanho: 'pequena' | 'media' | 'grande'
): Promise<Empresa[]> => {
  try {
    return await fetchApi<Empresa[]>(`/empresas/tamanho/${tamanho}`);
  } catch (error) {
    console.error(`Erro ao buscar empresas tamanho ${tamanho}:`, error);
    throw error;
  }
};

/**
 * Busca empresas por termo de pesquisa
 */
export const searchEmpresas = async (termo: string): Promise<Empresa[]> => {
  try {
    const params = new URLSearchParams({ q: termo });
    return await fetchApi<Empresa[]>(`/empresas/buscar/query?${params.toString()}`);
  } catch (error) {
    console.error(`Erro ao buscar empresas com termo "${termo}":`, error);
    throw error;
  }
};

export const fetchPlans = async (): Promise<Plan[]> => {
  return fetchApi<Plan[]>('/plans');
};

export const selectPlan = async (planId: string): Promise<Plan> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/plans/selection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ planId }),
  });

  const data: ApiResponse<Plan> = await response.json();
  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.error || 'Não foi possível selecionar o plano.');
  }

  return data.data;
};