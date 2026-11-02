import type { Company } from '../../entities/company.entity.js';
import type { CompanyRepository } from '../../repositories/company.repository.js';
import { db } from '../../shared/config/data.js';
import type { PlanRow } from '../../interfaces/plan.row.js';
import type { SaleRow } from '../../interfaces/sale.row.js';
import { createInitialSale } from '../../services/sale.service.js';
import { toSale } from '../sale.mapper.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';

// A API mantém o DTO português; o banco usa identificadores em inglês.
const columns = `id, name AS nome, tax_id AS cnpj, description AS descricao,
  detailed_description AS descricao_detalhada, category AS categoria, city AS cidade,
  state AS estado, status, is_verified AS verificado, size AS tamanho,
  created_at AS data_cadastro, logo, address AS endereco, phone AS telefone,
  email, website, whatsapp, additional_description AS descritivo, tone, cover_key, logo_key,
  plan_id, deleted_at, deactivation_reason, deactivated_at, deactivated_by`;

export const companyPostgresRepository: CompanyRepository = {
  async createCompanyWithInitialSale(input) {
    try {
      return await db.transaction(async client => {
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [String(input.actorId) + ':' + input.operationId]);
        const previous = (await client.query<{ fingerprint: string; company_id: string; sale_id: string | null }>(
          'SELECT fingerprint, company_id, sale_id FROM company_registration_operations WHERE actor_id=$1 AND operation_id=$2',
          [input.actorId, input.operationId])).rows[0];
        if (previous) {
          if (previous.fingerprint !== input.fingerprint) throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'A operação já foi usada com outros dados.' });
          const company = (await client.query<Company>('SELECT ' + columns + ' FROM companies WHERE id=$1', [previous.company_id])).rows[0];
          const sale = previous.sale_id ? (await client.query<SaleRow>('SELECT * FROM sales WHERE id=$1', [previous.sale_id])).rows[0] : undefined;
          if (!company || !sale) throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'A operação original não pode ser recriada. Consulte o cadastro existente.' });
          return { company, sale: toSale(sale), replayed: true };
        }
        const actor = (await client.query<{ role: string; status: string | null }>('SELECT role, status FROM users WHERE id=$1 FOR SHARE', [input.actorId])).rows[0];
        if (!actor || actor.role !== 'super_admin' || (actor.status != null && actor.status !== 'active')) throw new AppError({ status: 403, code: ErrorCode.FORBIDDEN, message: 'Acesso administrativo alterado.' });
        const plan = (await client.query<PlanRow>('SELECT * FROM plans WHERE id=$1 FOR SHARE', [input.planId])).rows[0];
        if (!plan) throw new AppError({ status: 404, code: ErrorCode.NOT_FOUND, message: 'Plano não encontrado.' });
        if (!plan.is_active) throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'O plano está inativo.' });
        const company = { ...input.company, plan_id: String(plan.id) };
        const sale = createInitialSale(company.id, plan, input.actorId);
        await client.query(`INSERT INTO companies (id,name,tax_id,description,detailed_description,category,city,state,status,is_verified,size,
          created_at,logo,address,phone,email,website,whatsapp,additional_description,tone,plan_id)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
          [company.id,company.nome,company.cnpj,company.descricao,company.descricao_detalhada,company.categoria,company.cidade,company.estado,
            company.status,company.verificado,company.tamanho,company.data_cadastro,company.logo??null,company.endereco??null,
            company.telefone??null,company.email??null,company.website??null,company.whatsapp??null,company.descritivo??null,company.tone??null,plan.id]);
        await client.query(`INSERT INTO sales (id,company_id,plan_id,origin,pricing_mode,plan_name,plan_price,plan_billing_period,amount,currency,description,sold_at,created_at,created_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [sale.id,sale.companyId,sale.planId,sale.origin,sale.pricingMode,sale.planName,sale.planPrice,sale.planBillingPeriod,sale.amount,sale.currency,sale.description,sale.soldAt,sale.createdAt,sale.createdBy]);
        await client.query('INSERT INTO company_registration_operations (actor_id,operation_id,fingerprint,company_id,sale_id) VALUES ($1,$2,$3,$4,$5)',
          [input.actorId,input.operationId,input.fingerprint,company.id,sale.id]);
        return { company, sale, replayed: false };
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'CNPJ, e-mail ou operação já cadastrado.' });
      throw error;
    }
  },
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
