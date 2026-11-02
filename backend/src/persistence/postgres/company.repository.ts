import type { Company } from '../../entities/company.entity.js';
import type { CompanyRepository } from '../../repositories/company.repository.js';
import { db } from '../../shared/config/data.js';

// A API mantém o DTO português; o banco usa identificadores em inglês.
const columns = `id, name AS nome, tax_id AS cnpj, description AS descricao,
  detailed_description AS descricao_detalhada, category AS categoria, city AS cidade,
  state AS estado, status, is_verified AS verificado, size AS tamanho,
  created_at AS data_cadastro, logo, address AS endereco, phone AS telefone,
  email, website, whatsapp, additional_description AS descritivo, tone, cover_key, logo_key`;

export const companyPostgresRepository: CompanyRepository = {
  async updateCoverKey(id, key, expectedKey) {
    const result = await db.query(
      'UPDATE companies SET cover_key = $1 WHERE id = $2 AND cover_key IS NOT DISTINCT FROM $3 RETURNING id',
      [key, id, expectedKey],
    );
    return result.rowCount === 1;
  },
  async updateLogoKey(id, key, expectedKey) {
    const result = await db.query(
      'UPDATE companies SET logo_key = $1 WHERE id = $2 AND logo_key IS NOT DISTINCT FROM $3 RETURNING id',
      [key, id, expectedKey],
    );
    return result.rowCount === 1;
  },
  async isImageKeyReferenced(key) {
    return (await db.query('SELECT id FROM companies WHERE cover_key = $1 OR logo_key = $1 LIMIT 1', [key])).rows.length > 0;
  },
  async create(company) {
    const names = ['id', 'name', 'tax_id', 'description', 'detailed_description', 'category',
      'city', 'state', 'status', 'is_verified', 'size', 'created_at', 'logo', 'address', 'phone',
      'email', 'website', 'whatsapp', 'additional_description', 'tone'];
    const values = [company.id, company.nome, company.cnpj, company.descricao,
      company.descricao_detalhada, company.categoria, company.cidade, company.estado,
      company.status, company.verificado, company.tamanho, company.data_cadastro ?? null,
      company.logo ?? null, company.endereco ?? null, company.telefone ?? null,
      company.email ?? null, company.website ?? null, company.whatsapp ?? null,
      company.descritivo ?? null, company.tone ?? null];
    const placeholders = names.map((_, index) => '$' + (index + 1)).join(', ');
    const result = await db.query<Company>(
      'INSERT INTO companies (' + names.join(', ') + ') VALUES (' + placeholders + ') RETURNING ' + columns, values,
    );
    if (!result.rows[0]) throw new Error('O banco não retornou a empresa cadastrada.');
    return result.rows[0];
  },
  async getAll() {
    return (await db.query<Company>('SELECT ' + columns + ' FROM companies')).rows;
  },
  async getById(id) {
    return (await db.query<Company>('SELECT ' + columns + ' FROM companies WHERE id = $1', [id])).rows[0];
  },
  async getVerified() {
    return (await db.query<Company>('SELECT ' + columns + ' FROM companies WHERE is_verified = TRUE')).rows;
  },
  async getByCategory(category) {
    return (await db.query<Company>('SELECT ' + columns + ' FROM companies WHERE LOWER(category) = LOWER($1)', [category])).rows;
  },
  async getByState(state) {
    return (await db.query<Company>('SELECT ' + columns + ' FROM companies WHERE UPPER(state) = UPPER($1)', [state])).rows;
  },
  async getBySize(size) {
    return (await db.query<Company>('SELECT ' + columns + ' FROM companies WHERE size = $1', [size])).rows;
  },
  async searchByName(name) {
    return (await db.query<Company>('SELECT ' + columns + ' FROM companies WHERE name ILIKE $1', ['%' + name + '%'])).rows;
  },
};
