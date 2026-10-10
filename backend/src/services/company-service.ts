import type { CompanyQuery } from '../interfaces/company-query.js';
import type { CompanyListResult, CompanyDetailResult } from '../dtos/company-response.js';

/** Preserve catalog queries/results until HTTP contract adoption. */
export function createCompanyService(queryClient: CompanyQuery) {
  /**
   * Busca todas as empresas do catálogo
   */
  const getCompanies = async (): Promise<CompanyListResult> => {
    try {
      const result = await queryClient.query('SELECT * FROM "empresas"');

      return {
        success: true,
        data: result.rows,
        message: 'Empresas carregadas com sucesso',
      };
    } catch (error) {
      console.error('Erro em getCompanies:', error);
      return {
        success: false,
        error: 'Erro ao buscar empresas no banco de dados',
      };
    }
  };

  /**
   * Busca uma empresa específica pelo ID (VARCHAR36 / UUID)
   */
  const getCompanyById = async (id: string): Promise<CompanyDetailResult> => {
    try {
      const result = await queryClient.query(
        'SELECT * FROM "empresas" WHERE id = $1',
        [id]
      );

      const company = result.rows[0];

      if (!company) {
        return {
          success: false,
          error: `Empresa com ID ${id} não encontrada`,
        };
      }

      return {
        success: true,
        data: company,
        message: 'Empresa carregada com sucesso',
      };
    } catch (error) {
      console.error(`Erro em getCompanyById (${id}):`, error);
      return {
        success: false,
        error: 'Erro ao buscar empresa no banco de dados',
      };
    }
  };

  /**
   * Busca empresas por categoria (case-insensitive)
   */
  const getCompaniesByCategory = async (category: string): Promise<CompanyListResult> => {
    try {
      const result = await queryClient.query(
        'SELECT * FROM "empresas" WHERE LOWER(categoria) = LOWER($1)',
        [category]
      );

      return {
        success: true,
        data: result.rows,
        message: `${result.rows.length} empresas encontradas na categoria ${category}`,
      };
    } catch (error) {
      console.error(`Erro em getCompaniesByCategory (${category}):`, error);
      return {
        success: false,
        error: 'Erro ao buscar empresas por categoria',
      };
    }
  };

  /**
   * Busca apenas empresas com verificado = true
   */
  const getVerifiedCompanies = async (): Promise<CompanyListResult> => {
    try {
      const result = await queryClient.query(
        'SELECT * FROM "empresas" WHERE verificado = TRUE'
      );

      return {
        success: true,
        data: result.rows,
        message: `${result.rows.length} empresas verificadas encontradas`,
      };
    } catch (error) {
      console.error('Erro em getVerifiedCompanies:', error);
      return {
        success: false,
        error: 'Erro ao buscar empresas verificadas',
      };
    }
  };

  /**
   * Busca empresas por estado (case-insensitive)
   */
  const getCompaniesByState = async (state: string): Promise<CompanyListResult> => {
    try {
      const result = await queryClient.query(
        'SELECT * FROM "empresas" WHERE UPPER(estado) = UPPER($1)',
        [state]
      );

      return {
        success: true,
        data: result.rows,
        message: `${result.rows.length} empresas encontradas em ${state}`,
      };
    } catch (error) {
      console.error(`Erro em getCompaniesByState (${state}):`, error);
      return {
        success: false,
        error: 'Erro ao buscar empresas por estado',
      };
    }
  };

  /**
   * Busca empresas por tamanho
   */
  const getCompaniesBySize = async (
    size: 'pequena' | 'media' | 'grande'
  ): Promise<CompanyListResult> => {
    try {
      const result = await queryClient.query(
        'SELECT * FROM "empresas" WHERE tamanho = $1',
        [size]
      );

      return {
        success: true,
        data: result.rows,
        message: `${result.rows.length} empresas ${size}s encontradas`,
      };
    } catch (error) {
      console.error(`Erro em getCompaniesBySize (${size}):`, error);
      return {
        success: false,
        error: 'Erro ao buscar empresas por tamanho',
      };
    }
  };

  /**
   * Busca empresas pelo nome (busca parcial usando ILIKE)
   */
  const searchCompanies = async (name: string): Promise<CompanyListResult> => {
    try {
      const result = await queryClient.query(
        'SELECT * FROM "empresas" WHERE nome ILIKE $1',
        [`%${name}%`]
      );

      return {
        success: true,
        data: result.rows,
        message: `${result.rows.length} empresas encontradas para a busca "${name}"`,
      };
    } catch (error) {
      console.error(`Erro em searchCompanies (${name}):`, error);
      return {
        success: false,
        error: 'Erro ao buscar empresas no banco de dados',
      };
    }
  };
  return { getCompanies, getCompanyById, getCompaniesByCategory, getVerifiedCompanies, getCompaniesByState, getCompaniesBySize, searchCompanies };
}

export type CompanyService = ReturnType<typeof createCompanyService>;
