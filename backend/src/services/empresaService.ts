/**
 * Serviço de Empresas
 * Consultas ao banco de dados PostgreSQL (Neon) alinhadas com a tabela "empresas"
 */

import { db } from '../config/data.js';

// Tipagem completa baseada na estrutura de colunas do seu PostgreSQL
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
  tone?: 'blue' | 'green' | 'orange' | 'purple' | 'gray' | null;
}

export interface EmpresasListResponse {
  success: boolean;
  data?: Empresa[];
  message?: string;
  error?: string;
}

export interface EmpresaDetailResponse {
  success: boolean;
  data?: Empresa;
  message?: string;
  error?: string;
}

/**
 * Busca todas as empresas do catálogo
 */
export const getEmpresas = async (): Promise<EmpresasListResponse> => {
  try {
    const result = await db.query<Empresa>('SELECT * FROM "empresas"');

    return {
      success: true,
      data: result.rows,
      message: 'Empresas carregadas com sucesso',
    };
  } catch (error) {
    console.error('Erro em getEmpresas:', error);
    return {
      success: false,
      error: 'Erro ao buscar empresas no banco de dados',
    };
  }
};

/**
 * Busca uma empresa específica pelo ID (VARCHAR36 / UUID)
 */
export const getEmpresaById = async (id: string): Promise<EmpresaDetailResponse> => {
  try {
    const result = await db.query<Empresa>(
      'SELECT * FROM "empresas" WHERE id = $1',
      [id]
    );

    const empresa = result.rows[0];

    if (!empresa) {
      return {
        success: false,
        error: `Empresa com ID ${id} não encontrada`,
      };
    }

    return {
      success: true,
      data: empresa,
      message: 'Empresa carregada com sucesso',
    };
  } catch (error) {
    console.error(`Erro em getEmpresaById (${id}):`, error);
    return {
      success: false,
      error: 'Erro ao buscar empresa no banco de dados',
    };
  }
};

/**
 * Busca empresas por categoria (case-insensitive)
 */
export const getEmpresasByCategoria = async (categoria: string): Promise<EmpresasListResponse> => {
  try {
    const result = await db.query<Empresa>(
      'SELECT * FROM "empresas" WHERE LOWER(categoria) = LOWER($1)',
      [categoria]
    );

    return {
      success: true,
      data: result.rows,
      message: `${result.rows.length} empresas encontradas na categoria ${categoria}`,
    };
  } catch (error) {
    console.error(`Erro em getEmpresasByCategoria (${categoria}):`, error);
    return {
      success: false,
      error: 'Erro ao buscar empresas por categoria',
    };
  }
};

/**
 * Busca apenas empresas com verificado = true
 */
export const getEmpresasVerificadas = async (): Promise<EmpresasListResponse> => {
  try {
    const result = await db.query<Empresa>(
      'SELECT * FROM "empresas" WHERE verificado = TRUE'
    );

    return {
      success: true,
      data: result.rows,
      message: `${result.rows.length} empresas verificadas encontradas`,
    };
  } catch (error) {
    console.error('Erro em getEmpresasVerificadas:', error);
    return {
      success: false,
      error: 'Erro ao buscar empresas verificadas',
    };
  }
};

/**
 * Busca empresas por estado (case-insensitive)
 */
export const getEmpresasByEstado = async (estado: string): Promise<EmpresasListResponse> => {
  try {
    const result = await db.query<Empresa>(
      'SELECT * FROM "empresas" WHERE UPPER(estado) = UPPER($1)',
      [estado]
    );

    return {
      success: true,
      data: result.rows,
      message: `${result.rows.length} empresas encontradas em ${estado}`,
    };
  } catch (error) {
    console.error(`Erro em getEmpresasByEstado (${estado}):`, error);
    return {
      success: false,
      error: 'Erro ao buscar empresas por estado',
    };
  }
};

/**
 * Busca empresas por tamanho
 */
export const getEmpresasByTamanho = async (
  tamanho: 'pequena' | 'media' | 'grande'
): Promise<EmpresasListResponse> => {
  try {
    const result = await db.query<Empresa>(
      'SELECT * FROM "empresas" WHERE tamanho = $1',
      [tamanho]
    );

    return {
      success: true,
      data: result.rows,
      message: `${result.rows.length} empresas ${tamanho}s encontradas`,
    };
  } catch (error) {
    console.error(`Erro em getEmpresasByTamanho (${tamanho}):`, error);
    return {
      success: false,
      error: 'Erro ao buscar empresas por tamanho',
    };
  }
};

/**
 * Busca empresas pelo nome (busca parcial usando ILIKE)
 */
export const searchEmpresas = async (nome: string): Promise<EmpresasListResponse> => {
  try {
    const result = await db.query<Empresa>(
      'SELECT * FROM "empresas" WHERE nome ILIKE $1',
      [`%${nome}%`]
    );

    return {
      success: true,
      data: result.rows,
      message: `${result.rows.length} empresas encontradas para a busca "${nome}"`,
    };
  } catch (error) {
    console.error(`Erro em searchEmpresas (${nome}):`, error);
    return {
      success: false,
      error: 'Erro ao buscar empresas no banco de dados',
    };
  }
};