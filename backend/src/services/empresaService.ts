/**
 * Serviço de Empresas
 * Funções para buscar dados do "banco de dados" (mock)
 * Simula chamadas assíncronas que serão substituídas por consultas reais ao banco
 */

import { Empresa, ApiResponse, EmpresasListResponse, EmpresaDetailResponse } from '../types/empresa';
import { empresasDatabase } from '../data/empresas';

/**
 * Simula uma API call com delay (imita latência de rede)
 * @param ms - Tempo de delay em milissegundos
 */
const simulateApiDelay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Busca todas as empresas do catálogo
 * @returns Promise<Empresa[]> - Array com todas as empresas
 */
export const getEmpresas = async (): Promise<EmpresasListResponse> => {
  try {
    await simulateApiDelay(300);
    return {
      success: true,
      data: empresasDatabase,
      message: 'Empresas carregadas com sucesso',
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao buscar empresas',
    };
  }
};

/**
 * Busca uma empresa específica pelo ID
 * @param id - ID da empresa
 * @returns Promise<Empresa | null> - Dados da empresa ou null se não encontrado
 */
export const getEmpresaById = async (id: string): Promise<EmpresaDetailResponse> => {
  try {
    await simulateApiDelay(250);

    const empresa = empresasDatabase.find((emp) => emp.id === id);

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
    return {
      success: false,
      error: 'Erro ao buscar empresa',
    };
  }
};

/**
 * Busca empresas por categoria
 * @param categoria - Categoria para filtrar
 * @returns Promise<Empresa[]> - Array com empresas da categoria
 */
export const getEmpresasByCategoria = async (categoria: string): Promise<EmpresasListResponse> => {
  try {
    await simulateApiDelay(300);

    const empresasFiltradas = empresasDatabase.filter(
      (emp) => emp.categoria.toLowerCase() === categoria.toLowerCase()
    );

    return {
      success: true,
      data: empresasFiltradas,
      message: `${empresasFiltradas.length} empresas encontradas na categoria ${categoria}`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao buscar empresas por categoria',
    };
  }
};

/**
 * Busca empresas verificadas
 * @returns Promise<Empresa[]> - Array com empresas verificadas
 */
export const getEmpresasVerificadas = async (): Promise<EmpresasListResponse> => {
  try {
    await simulateApiDelay(300);

    const empresasVerificadas = empresasDatabase.filter((emp) => emp.verificado);

    return {
      success: true,
      data: empresasVerificadas,
      message: `${empresasVerificadas.length} empresas verificadas encontradas`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao buscar empresas verificadas',
    };
  }
};

/**
 * Busca empresas por estado
 * @param estado - Sigla do estado (ex: 'SP', 'MG')
 * @returns Promise<Empresa[]> - Array com empresas do estado
 */
export const getEmpresasByEstado = async (estado: string): Promise<EmpresasListResponse> => {
  try {
    await simulateApiDelay(300);

    const empresasEstado = empresasDatabase.filter(
      (emp) => emp.estado.toUpperCase() === estado.toUpperCase()
    );

    return {
      success: true,
      data: empresasEstado,
      message: `${empresasEstado.length} empresas encontradas em ${estado}`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao buscar empresas por estado',
    };
  }
};

/**
 * Busca empresas por tamanho
 * @param tamanho - Tamanho da empresa ('pequena', 'media', 'grande')
 * @returns Promise<Empresa[]> - Array com empresas do tamanho especificado
 */
export const getEmpresasByTamanho = async (
  tamanho: 'pequena' | 'media' | 'grande'
): Promise<EmpresasListResponse> => {
  try {
    await simulateApiDelay(300);

    const empresasTamanho = empresasDatabase.filter((emp) => emp.tamanho === tamanho);

    return {
      success: true,
      data: empresasTamanho,
      message: `${empresasTamanho.length} empresas ${tamanho}s encontradas`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao buscar empresas por tamanho',
    };
  }
};

/**
 * Busca empresas pelo nome (busca parcial)
 * @param nome - Parte do nome da empresa
 * @returns Promise<Empresa[]> - Array com empresas que contêm o nome
 */
export const searchEmpresas = async (nome: string): Promise<EmpresasListResponse> => {
  try {
    await simulateApiDelay(300);

    const empresasEncontradas = empresasDatabase.filter((emp) =>
      emp.nome.toLowerCase().includes(nome.toLowerCase())
    );

    return {
      success: true,
      data: empresasEncontradas,
      message: `${empresasEncontradas.length} empresas encontradas para a busca "${nome}"`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao buscar empresas',
    };
  }
};
