/**
 * Serviço de API do Frontend
 * Consumo dos endpoints de empresas do backend
 */

// Importar a interface Empresa do backend (você pode copiar ou usar um caminho relativo)
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Busca todas as empresas
 */
export const fetchEmpresas = async (): Promise<Empresa[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/empresas`);
    const data: ApiResponse<Empresa[]> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar empresas');
    }

    return data.data || [];
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
    const response = await fetch(`${API_BASE_URL}/empresas/${id}`);
    const data: ApiResponse<Empresa> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Empresa não encontrada');
    }

    if (!data.data) {
      throw new Error('Dados da empresa não disponíveis');
    }

    return data.data;
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
    const response = await fetch(`${API_BASE_URL}/empresas/categoria/${categoria}`);
    const data: ApiResponse<Empresa[]> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar empresas por categoria');
    }

    return data.data || [];
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
    const response = await fetch(`${API_BASE_URL}/empresas/verificadas/todas`);
    const data: ApiResponse<Empresa[]> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar empresas verificadas');
    }

    return data.data || [];
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
    const response = await fetch(`${API_BASE_URL}/empresas/estado/${estado}`);
    const data: ApiResponse<Empresa[]> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar empresas por estado');
    }

    return data.data || [];
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
    const response = await fetch(`${API_BASE_URL}/empresas/tamanho/${tamanho}`);
    const data: ApiResponse<Empresa[]> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar empresas por tamanho');
    }

    return data.data || [];
  } catch (error) {
    console.error(`Erro ao buscar empresas tamanho ${tamanho}:`, error);
    throw error;
  }
};

/**
 * Busca empresas por termo
 */
export const searchEmpresas = async (termo: string): Promise<Empresa[]> => {
  try {
    const params = new URLSearchParams({ q: termo });
    const response = await fetch(`${API_BASE_URL}/empresas/buscar/query?${params}`);
    const data: ApiResponse<Empresa[]> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar empresas');
    }

    return data.data || [];
  } catch (error) {
    console.error(`Erro ao buscar empresas com termo "${termo}":`, error);
    throw error;
  }
};
