import { db } from '../config/data.js';
import type { Company } from '../entities/company.entity.js';
import type { CompanyListResult, CompanyDetailResult } from '../dtos/company.response.dto.js';

/** Preserva consultas e respostas do catálogo até a adoção dos contratos HTTP. */
/**
 * Busca todas as empresas do catálogo
 */
export async function getCompanies(): Promise<CompanyListResult> {
  try {
    const result = await db.query<Company>('SELECT * FROM "empresas"');

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
}

/**
 * Busca uma empresa específica pelo ID (VARCHAR36 / UUID)
 */
export async function getCompanyById(id: string): Promise<CompanyDetailResult> {
  try {
    const result = await db.query<Company>(
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
}

/**
 * Busca empresas por categoria (sem diferenciar maiúsculas e minúsculas)
 */
export async function getCompaniesByCategory(category: string): Promise<CompanyListResult> {
  try {
    const result = await db.query<Company>(
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
}

/**
 * Busca apenas empresas com verificado = true
 */
export async function getVerifiedCompanies(): Promise<CompanyListResult> {
  try {
    const result = await db.query<Company>(
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
}

/**
 * Busca empresas por estado (sem diferenciar maiúsculas e minúsculas)
 */
export async function getCompaniesByState(state: string): Promise<CompanyListResult> {
  try {
    const result = await db.query<Company>(
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
}

/**
 * Busca empresas por tamanho
 */
export async function getCompaniesBySize(
  size: 'pequena' | 'media' | 'grande'
): Promise<CompanyListResult> {
  try {
    const result = await db.query<Company>(
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
}

/**
 * Busca empresas pelo nome (busca parcial usando ILIKE)
 */
export async function searchCompanies(name: string): Promise<CompanyListResult> {
  try {
    const result = await db.query<Company>(
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
}
