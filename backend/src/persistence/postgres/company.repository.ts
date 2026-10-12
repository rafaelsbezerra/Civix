import type { Company } from '../../entities/company.entity.js';
import type { CompanyRepository } from '../../repositories/company.repository.js';
import { db } from '../../shared/config/data.js';

export const companyPostgresRepository: CompanyRepository = {
  async create(company) {
    const columns = [
      'id', 'nome', 'cnpj', 'descricao', 'descricao_detalhada', 'categoria',
      'cidade', 'estado', 'status', 'verificado', 'tamanho', 'data_cadastro',
      'logo', 'endereco', 'telefone', 'email', 'website', 'whatsapp', 'descritivo', 'tone',
    ] as const;
    const values = columns.map(column => company[column] ?? null);
    const fields = columns.map(column => '"' + column + '"').join(', ');
    const placeholders = columns.map((_, index) => '$' + (index + 1)).join(', ');
    const result = await db.query<Company>(
      'INSERT INTO "empresas" (' + fields + ') VALUES (' + placeholders + ') RETURNING *',
      values,
    );
    const created = result.rows[0];

    if (!created) {
      throw new Error('O banco não retornou a empresa cadastrada.');
    }

    return created;
  },

  async getAll() {
    return (await db.query<Company>('SELECT * FROM "empresas"')).rows;
  },

  async getById(id) {
    return (await db.query<Company>('SELECT * FROM "empresas" WHERE id = $1', [id])).rows[0];
  },

  async getVerified() {
    return (await db.query<Company>('SELECT * FROM "empresas" WHERE verificado = TRUE')).rows;
  },

  async getByCategory(category) {
    return (await db.query<Company>('SELECT * FROM "empresas" WHERE LOWER(categoria) = LOWER($1)', [category])).rows;
  },

  async getByState(state) {
    return (await db.query<Company>('SELECT * FROM "empresas" WHERE UPPER(estado) = UPPER($1)', [state])).rows;
  },

  async getBySize(size) {
    return (await db.query<Company>('SELECT * FROM "empresas" WHERE tamanho = $1', [size])).rows;
  },

  async searchByName(name) {
    return (await db.query<Company>('SELECT * FROM "empresas" WHERE nome ILIKE $1', ['%' + name + '%'])).rows;
  },
};