import { db } from '../shared/config/data.js';
import type { Company } from '../entities/company.entity.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';

export async function getCompanies(): Promise<Company[]> {
  const result = await db.query<Company>(
    'SELECT * FROM "empresas"'
  );

  return result.rows;
}

export async function getVerifiedCompanies(): Promise<Company[]> {
  const result = await db.query<Company>(
    'SELECT * FROM "empresas" WHERE verificado = TRUE'
  );

  return result.rows;
}

export async function getCompaniesByCategory(category: string): Promise<Company[]> {
  const result = await db.query<Company>(
    'SELECT * FROM "empresas" WHERE LOWER(categoria) = LOWER($1)',
    [category]
  );

  return result.rows;
}

export async function getCompaniesByState(state: string): Promise<Company[]> {
  const result = await db.query<Company>(
    'SELECT * FROM "empresas" WHERE UPPER(estado) = UPPER($1)',
    [state]
  );

  return result.rows;
}

export async function getCompaniesBySize(size: 'pequena' | 'media' | 'grande'): Promise<Company[]> {
  const result = await db.query<Company>(
    'SELECT * FROM "empresas" WHERE tamanho = $1',
    [size]
  );

  return result.rows;
}

export async function searchCompanies(name: string): Promise<Company[]> {
  const result = await db.query<Company>(
    'SELECT * FROM "empresas" WHERE nome ILIKE $1',
    [`%${name}%`]
  );

  return result.rows;
}

export async function getCompanyById(id: string): Promise<Company> {
  const result = await db.query<Company>(
    'SELECT * FROM "empresas" WHERE id = $1',
    [id]
  );

  const company = result.rows[0];

  if (!company) {
    throw new AppError({
      status: 404,
      code: ErrorCode.NOT_FOUND,
      message: `Empresa com ID ${id} não encontrada`,
    });
  }

  return company;
}
