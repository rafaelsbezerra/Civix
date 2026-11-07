import type { SaleRepository } from '../../repositories/sale.repository.js';
import type { SaleRow } from '../../interfaces/sale.row.js';
import { db } from '../../shared/config/data.js';
import { toSale } from '../sale.mapper.js';
import type { PlanRow } from '../../interfaces/plan.row.js';
import { buildManualSale } from '../../services/sale.service.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
export const salePostgresRepository: SaleRepository = {
  async listPlatformSales(filters) {
    const values: unknown[] = [];
    const conditions: string[] = [];
    for (const [column, value, operator] of [
      ['s.company_id', filters.companyId, '='],
      ['s.plan_id', filters.planId, '='],
      ['s.origin', filters.origin, '='],
      ['s.sold_at', filters.from, '>='],
      ['s.sold_at', filters.to, '<='],
    ] as const) {
      if (value !== undefined) {
        values.push(value);
        conditions.push(column + operator + '$' + values.length);
      }
    }
    values.push(filters.pageSize, filters.offset);
    const query =
      'WITH filtered AS (SELECT s.id,s.company_id,c.name AS company_name,s.plan_id::text AS plan_id,s.origin,s.pricing_mode,s.plan_name,s.plan_price::text AS plan_price,s.plan_billing_period,s.amount::text AS amount,s.currency,s.description,s.sold_at,s.created_at,s.created_by FROM sales s JOIN companies c ON c.id=s.company_id' +
      (conditions.length ? ' WHERE ' + conditions.join(' AND ') : '') +
      ') SELECT (SELECT COUNT(*)::int FROM filtered) AS total, ' +
      'COALESCE((SELECT json_agg(page_rows) FROM (SELECT * FROM filtered ORDER BY sold_at DESC,id LIMIT $' +
      (values.length - 1) +
      ' OFFSET $' +
      values.length +
      ") page_rows),'[]'::json) AS items";
    const row = (await db.query<{ items: SaleRow[]; total: number }>(query, values))
      .rows[0];
    return { items: row.items.map(toSale), total: row.total };
  },
  async createManualSale(operation) {
    return db.transaction(async (client) => {
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration', 0))",
      );
      const actor = (
        await client.query<{
          role: string;
          status: string | null;
          deleted_at: string | null;
        }>('SELECT role,status,deleted_at FROM users WHERE id=$1 FOR UPDATE', [
          operation.actorId,
        ])
      ).rows[0];
      if (
        !actor ||
        actor.role !== 'super_admin' ||
        actor.deleted_at ||
        (actor.status != null && actor.status !== 'active')
      ) {
        throw new AppError({
          status: 403,
          code: ErrorCode.FORBIDDEN,
          message: 'Acesso administrativo alterado.',
        });
      }
      const previous = (
        await client.query<SaleRow>(
          'SELECT * FROM sales WHERE created_by=$1 AND operation_id=$2',
          [operation.actorId, operation.input.operationId],
        )
      ).rows[0];
      if (previous) {
        if (previous.fingerprint !== operation.fingerprint) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'A operação já foi usada com outros dados.',
          });
        }
        return { sale: toSale(previous), replayed: true };
      }
      const company = (
        await client.query<{
          plan_id: string | null;
          status: string;
          deleted_at: string | null;
        }>('SELECT plan_id,status,deleted_at FROM companies WHERE id=$1 FOR SHARE', [
          operation.input.companyId,
        ])
      ).rows[0];
      if (!company || company.deleted_at || company.status === 'inativo') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Empresa indisponível para nova venda.',
        });
      }
      const plan =
        operation.input.pricingMode === 'company_plan' && company.plan_id
          ? (
              await client.query<PlanRow>('SELECT * FROM plans WHERE id=$1 FOR SHARE', [
                company.plan_id,
              ])
            ).rows[0]
          : undefined;
      const sale = buildManualSale(operation, plan);
      await client.query(
        'INSERT INTO sales (id,company_id,plan_id,origin,pricing_mode,plan_name,plan_price,plan_billing_period,amount,currency,description,sold_at,created_at,created_by,operation_id,fingerprint) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)',
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
          sale.operationId,
          sale.fingerprint,
        ],
      );
      return { sale, replayed: false };
    });
  },
  async deleteSaleById(id, actorId) {
    return db.transaction(async (client) => {
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration', 0))",
      );
      const actor = (
        await client.query<{
          role: string;
          status: string | null;
          deleted_at: string | null;
        }>('SELECT role,status,deleted_at FROM users WHERE id=$1 FOR UPDATE', [actorId])
      ).rows[0];
      if (
        !actor ||
        actor.role !== 'super_admin' ||
        actor.deleted_at ||
        (actor.status != null && actor.status !== 'active')
      ) {
        throw new AppError({
          status: 403,
          code: ErrorCode.FORBIDDEN,
          message: 'Acesso administrativo alterado.',
        });
      }
      return (
        (await client.query('DELETE FROM sales WHERE id=$1 RETURNING id', [id])).rows
          .length === 1
      );
    });
  },
  async getById(id) {
    const row = (await db.query<SaleRow>('SELECT * FROM sales WHERE id = $1', [id]))
      .rows[0];
    return row ? toSale(row) : undefined;
  },
};
