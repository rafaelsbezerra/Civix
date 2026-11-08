import {
  PRICE_RANGE_TO_NUMRANGE,
  type Company,
  type CompanyPriceRange,
} from '../../entities/company.entity.js';
import type { CompanyRepository } from '../../repositories/company.repository.js';
import { db } from '../../shared/config/data.js';
import type { PlanRow } from '../../interfaces/plan.row.js';
import type { SaleRow } from '../../interfaces/sale.row.js';
import { createInitialSale } from '../../services/sale.service.js';
import { toSale } from '../sale.mapper.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { normalizePlanPrice } from '../../services/plan.service.js';

function toNumrangeLiteral(priceRange?: CompanyPriceRange | null): string | null {
  if (!priceRange) {
    return null;
  }
  return PRICE_RANGE_TO_NUMRANGE[priceRange] ?? null;
}

// A API mantém o DTO português; o banco usa identificadores em inglês.
const columns = `id, name AS nome, cnpj, description AS descricao,
  detailed_description AS descricao_detalhada, category AS categoria, city AS cidade,
  state AS estado, LOWER(status::text) AS status, is_verified AS verificado, size AS tamanho,
  CASE
    WHEN price_range IS NULL THEN NULL
    WHEN lower(price_range) = 0 AND upper(price_range) = 100 THEN '0-100'
    WHEN lower(price_range) = 100 AND upper(price_range) = 300 THEN '100-300'
    WHEN lower(price_range) = 300 AND upper(price_range) = 500 THEN '300-500'
    WHEN lower(price_range) >= 500 AND upper_inf(price_range) THEN '500-plus'
    ELSE NULL
  END AS faixa_preco,
  created_at AS data_cadastro, created_at AS "createdAt", updated_at AS "updatedAt",
  logo, address AS endereco, phone AS telefone,
  email, website, whatsapp, additional_description AS descritivo, tone, cover_key, logo_key,
  plan_id, deleted_at, deactivation_reason, deactivated_at, deactivated_by`;

export const companyPostgresRepository: CompanyRepository = {
  async listPlatformCompanies(filters) {
    const values: unknown[] = [];
    const where: string[] = [];
    if (filters.q) {
      values.push('%' + filters.q.replace(/[\\%_]/g, '\\$&') + '%');
      where.push(
        '(name ILIKE $' + values.length + ' OR cnpj ILIKE $' + values.length + ')',
      );
    }
    if (filters.planId) {
      values.push(filters.planId);
      where.push('plan_id=$' + values.length);
    }
    if (filters.status === 'archived') {
      where.push('deleted_at IS NOT NULL');
    } else if (filters.status) {
      where.push(
        'deleted_at IS NULL AND UPPER(status::text) ' +
          (filters.status === 'ativo' ? "<> 'INATIVO'" : "= 'INATIVO'"),
      );
    }
    values.push(filters.pageSize, filters.offset);
    const query =
      'WITH filtered AS (SELECT ' +
      columns.replace('plan_id,', 'plan_id::text AS plan_id,') +
      ' FROM companies' +
      (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      ') SELECT (SELECT COUNT(*)::int FROM filtered) AS total, COALESCE((SELECT json_agg(page_rows) FROM ' +
      '(SELECT * FROM filtered ORDER BY nome, id LIMIT $' +
      (values.length - 1) +
      ' OFFSET $' +
      values.length +
      ") page_rows), '[]'::json) AS items";
    return (await db.query<{ total: number; items: Company[] }>(query, values)).rows[0];
  },
  async changeCompanyAdministration(input) {
    try {
      return await db.transaction(async (client) => {
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration', 0))",
        );
        const actor = (
          await client.query<{
            role: string;
            status: string | null;
            deleted_at: string | null;
          }>('SELECT role,status,deleted_at FROM users WHERE id=$1 FOR UPDATE', [
            input.actorId,
          ])
        ).rows[0];
        if (
          !actor ||
          actor.role.toLowerCase() !== 'super_admin' ||
          actor.deleted_at ||
          (actor.status != null && actor.status.toLowerCase() !== 'active')
        ) {
          throw new AppError({
            status: 403,
            code: ErrorCode.FORBIDDEN,
            message: 'Acesso administrativo alterado.',
          });
        }
        const company = (
          await client.query<Company>(
            'SELECT ' + columns + ' FROM companies WHERE id=$1 FOR UPDATE',
            [input.companyId],
          )
        ).rows[0];
        if (!company) {
          throw new AppError({
            status: 404,
            code: ErrorCode.NOT_FOUND,
            message: 'Empresa não encontrada.',
          });
        }
        if (input.action === 'restore') {
          if (!company.deleted_at) {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'A empresa não está arquivada.',
            });
          }
          return (
            await client.query<Company>(
              "UPDATE companies SET deleted_at=NULL,status='INATIVO'::company_status,updated_at=NOW() WHERE id=$1 RETURNING " +
                columns,
              [company.id],
            )
          ).rows[0];
        }
        if (company.deleted_at) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'Restaure a empresa antes de alterá-la.',
          });
        }
        if (input.action === 'update') {
          const { planId, ...fields } = input.fields!;
          const plan = (
            await client.query<PlanRow>('SELECT * FROM plans WHERE id=$1 FOR SHARE', [
              planId,
            ])
          ).rows[0];
          if (!plan) {
            throw new AppError({
              status: 404,
              code: ErrorCode.NOT_FOUND,
              message: 'Plano não encontrado.',
            });
          }
          if (String(company.plan_id) !== String(plan.id)) {
            if (!plan.is_active) {
              throw new AppError({
                status: 400,
                code: ErrorCode.VALIDATION_ERROR,
                message: 'Plano inativo.',
              });
            }
            normalizePlanPrice(String(plan.price));
          }
          const names: Record<string, string> = {
            nome: 'name',
            cnpj: 'cnpj',
            descricao: 'description',
            descricao_detalhada: 'detailed_description',
            categoria: 'category',
            cidade: 'city',
            estado: 'state',
            tamanho: 'size',
            faixa_preco: 'price_range',
            logo: 'logo',
            endereco: 'address',
            telefone: 'phone',
            email: 'email',
            website: 'website',
            whatsapp: 'whatsapp',
            descritivo: 'additional_description',
            tone: 'tone',
          };
          const entries = Object.entries(fields);
          const values: unknown[] = entries.map(([key, value]) =>
            key === 'faixa_preco'
              ? toNumrangeLiteral(value as CompanyPriceRange | null | undefined)
              : value,
          );
          const updates = entries.map(([key], index) => {
            if (!names[key]) {
              throw new Error('Campo de empresa não permitido.');
            }
            if (key === 'faixa_preco') {
              return names[key] + '=$' + (index + 1) + '::numrange';
            }
            return names[key] + '=$' + (index + 1);
          });
          values.push(planId, company.id);
          return (
            await client.query<Company>(
              'UPDATE companies SET ' +
                updates.join(',') +
                ',plan_id=$' +
                (values.length - 1) +
                ',updated_at=NOW()' +
                ' WHERE id=$' +
                values.length +
                ' RETURNING ' +
                columns,
              values,
            )
          ).rows[0];
        }
        if (input.action === 'reactivate') {
          if (company.status !== 'inativo') {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'A empresa já está ativa.',
            });
          }
          return (
            await client.query<Company>(
              "UPDATE companies SET status='ATIVO'::company_status,updated_at=NOW() WHERE id=$1 RETURNING " +
                columns,
              [company.id],
            )
          ).rows[0];
        }
        await client.query(
          "UPDATE users SET invite_token=NULL,reset_password_token=NULL,reset_password_expires=NULL,tokens_revoked_at=GREATEST($1::timestamptz,date_trunc('milliseconds',clock_timestamp()),COALESCE(tokens_revoked_at,'epoch'::timestamptz)+INTERVAL '2 milliseconds'),updated_at=NOW() WHERE company_id=$2",
          [input.changedAt, company.id],
        );
        return (
          await client.query<Company>(
            "UPDATE companies SET status='INATIVO'::company_status,deactivation_reason=$1,deactivated_at=GREATEST($2::timestamptz,date_trunc('milliseconds',clock_timestamp())),deactivated_by=$3,updated_at=NOW()" +
              (input.action === 'archive'
                ? ",deleted_at=GREATEST($2::timestamptz,date_trunc('milliseconds',clock_timestamp()))"
                : '') +
              ' WHERE id=$4 RETURNING ' +
              columns,
            [input.reason, input.changedAt, input.actorId, company.id],
          )
        ).rows[0];
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'CNPJ ou e-mail de empresa já cadastrado.',
        });
      }
      throw error;
    }
  },
  async createCompanyWithInitialSale(input) {
    try {
      return await db.transaction(async (client) => {
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
          String(input.actorId) + ':' + input.operationId,
        ]);
        const previous = (
          await client.query<{
            fingerprint: string;
            company_id: string;
            sale_id: string | null;
          }>(
            'SELECT fingerprint, company_id, sale_id FROM company_registration_operations WHERE actor_id=$1 AND operation_id=$2',
            [input.actorId, input.operationId],
          )
        ).rows[0];
        if (previous) {
          if (previous.fingerprint !== input.fingerprint) {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message: 'A operação já foi usada com outros dados.',
            });
          }
          const company = (
            await client.query<Company>(
              'SELECT ' + columns + ' FROM companies WHERE id=$1',
              [previous.company_id],
            )
          ).rows[0];
          const sale = previous.sale_id
            ? (
                await client.query<SaleRow>('SELECT * FROM sales WHERE id=$1', [
                  previous.sale_id,
                ])
              ).rows[0]
            : undefined;
          if (!company || !sale) {
            throw new AppError({
              status: 409,
              code: ErrorCode.CONFLICT,
              message:
                'A operação original não pode ser recriada. Consulte o cadastro existente.',
            });
          }
          return { company, sale: toSale(sale), replayed: true };
        }
        const actor = (
          await client.query<{ role: string; status: string | null }>(
            'SELECT role, status FROM users WHERE id=$1 FOR SHARE',
            [input.actorId],
          )
        ).rows[0];
        if (
          !actor ||
          actor.role.toLowerCase() !== 'super_admin' ||
          (actor.status != null && actor.status.toLowerCase() !== 'active')
        ) {
          throw new AppError({
            status: 403,
            code: ErrorCode.FORBIDDEN,
            message: 'Acesso administrativo alterado.',
          });
        }
        const plan = (
          await client.query<PlanRow>('SELECT * FROM plans WHERE id=$1 FOR SHARE', [
            input.planId,
          ])
        ).rows[0];
        if (!plan) {
          throw new AppError({
            status: 404,
            code: ErrorCode.NOT_FOUND,
            message: 'Plano não encontrado.',
          });
        }
        if (!plan.is_active) {
          throw new AppError({
            status: 400,
            code: ErrorCode.VALIDATION_ERROR,
            message: 'O plano está inativo.',
          });
        }
        const company = { ...input.company, plan_id: String(plan.id) };
        const sale = createInitialSale(company.id, plan, input.actorId);
        await client.query(
          `INSERT INTO companies (id,name,cnpj,description,detailed_description,category,city,state,status,is_verified,size,
          created_at,logo,address,phone,email,website,whatsapp,additional_description,tone,plan_id,price_range)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,UPPER($9)::company_status,$10,$11,COALESCE($12::timestamptz,NOW()),$13,$14,$15,$16,$17,$18,$19,$20,$21,$22::numrange)`,
          [
            company.id,
            company.nome,
            company.cnpj,
            company.descricao,
            company.descricao_detalhada,
            company.categoria,
            company.cidade,
            company.estado,
            company.status,
            company.verificado,
            company.tamanho,
            company.data_cadastro ?? null,
            company.logo ?? null,
            company.endereco ?? null,
            company.telefone ?? null,
            company.email ?? null,
            company.website ?? null,
            company.whatsapp ?? null,
            company.descritivo ?? null,
            company.tone ?? null,
            plan.id,
            toNumrangeLiteral(company.faixa_preco),
          ],
        );
        await client.query(
          `INSERT INTO sales (id,company_id,plan_id,origin,pricing_mode,plan_name,plan_price,plan_billing_period,amount,currency,description,sold_at,created_at,created_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [
            sale.id,
            sale.companyId,
            sale.planId,
            sale.origin,
            sale.pricingMode,
            sale.planName,
            sale.planPrice,
            sale.planBillingPeriod,
            sale.amount,
            sale.currency,
            sale.description,
            sale.soldAt,
            sale.createdAt,
            sale.createdBy,
          ],
        );
        await client.query(
          'INSERT INTO company_registration_operations (actor_id,operation_id,fingerprint,company_id,sale_id) VALUES ($1,$2,$3,$4,$5)',
          [input.actorId, input.operationId, input.fingerprint, company.id, sale.id],
        );
        return { company, sale, replayed: false };
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'CNPJ, e-mail ou operação já cadastrado.',
        });
      }
      throw error;
    }
  },
  async updateCoverKey(id, key, expectedKey) {
    const result = await db.query(
      "UPDATE companies SET cover_key = $1, updated_at = NOW() WHERE id = $2 AND cover_key IS NOT DISTINCT FROM $3 AND deleted_at IS NULL AND UPPER(status::text) <> 'INATIVO' RETURNING id",
      [key, id, expectedKey],
    );
    return result.rowCount === 1;
  },
  async updateLogoKey(id, key, expectedKey) {
    const result = await db.query(
      "UPDATE companies SET logo_key = $1, updated_at = NOW() WHERE id = $2 AND logo_key IS NOT DISTINCT FROM $3 AND deleted_at IS NULL AND UPPER(status::text) <> 'INATIVO' RETURNING id",
      [key, id, expectedKey],
    );
    return result.rowCount === 1;
  },
  async isImageKeyReferenced(key) {
    return (
      (
        await db.query(
          'SELECT id FROM companies WHERE cover_key = $1 OR logo_key = $1 LIMIT 1',
          [key],
        )
      ).rows.length > 0
    );
  },
  async create(company) {
    const names = [
      'id',
      'name',
      'cnpj',
      'description',
      'detailed_description',
      'category',
      'city',
      'state',
      'status',
      'is_verified',
      'size',
      'created_at',
      'logo',
      'address',
      'phone',
      'email',
      'website',
      'whatsapp',
      'additional_description',
      'tone',
      'price_range',
    ];
    const values = [
      company.id,
      company.nome,
      company.cnpj,
      company.descricao,
      company.descricao_detalhada,
      company.categoria,
      company.cidade,
      company.estado,
      company.status,
      company.verificado,
      company.tamanho,
      company.data_cadastro ?? null,
      company.logo ?? null,
      company.endereco ?? null,
      company.telefone ?? null,
      company.email ?? null,
      company.website ?? null,
      company.whatsapp ?? null,
      company.descritivo ?? null,
      company.tone ?? null,
      toNumrangeLiteral(company.faixa_preco),
    ];
    const placeholders = names
      .map((column, index) => {
        const param = '$' + (index + 1);
        if (column === 'status') {
          return `UPPER(${param})::company_status`;
        }
        if (column === 'created_at') {
          return `COALESCE(${param}::timestamptz, NOW())`;
        }
        if (column === 'price_range') {
          return `${param}::numrange`;
        }
        return param;
      })
      .join(', ');
    const result = await db.query<Company>(
      'INSERT INTO companies (' +
        names.join(', ') +
        ') VALUES (' +
        placeholders +
        ') RETURNING ' +
        columns,
      values,
    );
    if (!result.rows[0]) {
      throw new Error('O banco não retornou a empresa cadastrada.');
    }
    return result.rows[0];
  },
  async getAll() {
    return (await db.query<Company>('SELECT ' + columns + ' FROM companies')).rows;
  },
  async getById(id) {
    return (
      await db.query<Company>('SELECT ' + columns + ' FROM companies WHERE id = $1', [
        id,
      ])
    ).rows[0];
  },
  async getVerified() {
    return (
      await db.query<Company>(
        'SELECT ' + columns + ' FROM companies WHERE is_verified = TRUE',
      )
    ).rows;
  },
  async getByCategory(category) {
    return (
      await db.query<Company>(
        'SELECT ' + columns + ' FROM companies WHERE LOWER(category) = LOWER($1)',
        [category],
      )
    ).rows;
  },
  async getByState(state) {
    return (
      await db.query<Company>(
        'SELECT ' + columns + ' FROM companies WHERE UPPER(state) = UPPER($1)',
        [state],
      )
    ).rows;
  },
  async getBySize(size) {
    return (
      await db.query<Company>('SELECT ' + columns + ' FROM companies WHERE size = $1', [
        size,
      ])
    ).rows;
  },
  async searchByName(name) {
    return (
      await db.query<Company>(
        'SELECT ' + columns + ' FROM companies WHERE name ILIKE $1',
        ['%' + name + '%'],
      )
    ).rows;
  },
  async searchPublicCompanies(filters) {
    if (filters.q && !filters.uf && !filters.priceRange) {
      return this.searchByName(filters.q);
    }

    const values: string[] = [];
    const where: string[] = ['deleted_at IS NULL', "UPPER(status::text) <> 'INATIVO'"];

    if (filters.q) {
      values.push('%' + filters.q.replace(/[\\%_]/g, '\\$&') + '%');
      where.push(`name ILIKE $${values.length}`);
    }

    if (filters.uf) {
      values.push(filters.uf);
      where.push(`UPPER(state) = UPPER($${values.length})`);
    }

    if (filters.priceRange) {
      values.push(PRICE_RANGE_TO_NUMRANGE[filters.priceRange]);
      where.push(
        `price_range IS NOT NULL AND price_range && $${values.length}::numrange`,
      );
    }

    return (
      await db.query<Company>(
        'SELECT ' +
          columns +
          ' FROM companies WHERE ' +
          where.join(' AND ') +
          ' ORDER BY name, id',
        values,
      )
    ).rows;
  },
};
