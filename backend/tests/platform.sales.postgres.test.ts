import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { SaleRow } from '../src/interfaces/sale.row.js';
import type { PlanRow } from '../src/interfaces/plan.row.js';

Object.assign(process.env, { USE_MOCK_DATA: 'true', LOG_LEVEL: 'fatal' });
const { db } = await import('../src/shared/config/data.js');
const { salePostgresRepository } =
  await import('../src/persistence/postgres/sale.repository.js');

const actorId = randomUUID();
const companyId = randomUUID();
const saleId = randomUUID();
const operationId = randomUUID();
const planId = '9007199254740993123';
const fingerprint = 'a'.repeat(64);
const plan: PlanRow = {
  id: planId,
  name: 'Plano histórico',
  slug: 'plano-historico',
  description: 'Plano sintético',
  price: '39.90',
  billing_period: 'monthly',
  features: [],
  limits: {},
  is_featured: false,
  is_active: true,
  display_order: 1,
};

function saleRow(overrides: Partial<SaleRow> = {}): SaleRow {
  return {
    id: saleId,
    company_id: companyId,
    company_name: 'Empresa sintética',
    plan_id: planId,
    origin: 'manual',
    pricing_mode: 'company_plan',
    plan_name: plan.name,
    plan_price: '39.90',
    plan_billing_period: 'monthly',
    amount: '39.90',
    currency: 'BRL',
    description: 'Venda sintética',
    sold_at: '2026-11-01T12:00:00.000Z',
    created_at: '2026-11-01T12:00:00.000Z',
    created_by: actorId,
    operation_id: operationId,
    fingerprint,
    ...overrides,
  };
}

const operation = {
  actorId,
  input: {
    companyId,
    operationId,
    pricingMode: 'company_plan' as const,
    description: 'Venda sintética',
    soldAt: '2026-11-01T12:00:00.000Z',
  },
  fingerprint,
};

test('adapter PostgreSQL de vendas usa consultas simuladas, sem conectar ao banco', async (t) => {
  await t.test(
    'lista filtra, pagina em ordem estável e converte valores monetários para texto',
    async (sub) => {
      let statement = '';
      let values: unknown[] | undefined;
      const row = saleRow();
      sub.mock.method(db, 'query', async (text: string, parameters?: unknown[]) => {
        statement = text;
        values = parameters;
        return { rows: [{ items: [row], total: 7 }] } as never;
      });

      const result = await salePostgresRepository.listPlatformSales({
        companyId,
        planId,
        origin: 'manual',
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-11-30T23:59:59.000Z',
        pageSize: 5,
        offset: 10,
      });

      assert.match(statement, /c\.name AS company_name/);
      assert.match(statement, /s\.plan_price::text AS plan_price/);
      assert.match(statement, /s\.amount::text AS amount/);
      assert.match(statement, /ORDER BY sold_at DESC,id LIMIT \$6 OFFSET \$7/);
      assert.deepEqual(values, [
        companyId,
        planId,
        'manual',
        '2026-10-01T00:00:00.000Z',
        '2026-11-30T23:59:59.000Z',
        5,
        10,
      ]);
      assert.equal(result.total, 7);
      assert.equal(result.items[0].amount, '39.90');
      assert.equal(result.items[0].planPrice, '39.90');
      assert.equal(result.items[0].companyName, 'Empresa sintética');
    },
  );

  await t.test(
    'cria snapshot do plano em transação com lock, valida ator/empresa e mantém operação',
    async (sub) => {
      const queries: { text: string; values?: unknown[] }[] = [];
      const events: string[] = [];
      const client = {
        async query(text: string, parameters?: unknown[]) {
          queries.push({ text, values: parameters });
          if (text.includes('pg_advisory_xact_lock')) {
            return { rows: [] };
          }
          if (text.includes('FROM users')) {
            return {
              rows: [{ role: 'super_admin', status: 'active', deleted_at: null }],
            };
          }
          if (text.includes('FROM sales')) {
            return { rows: [] };
          }
          if (text.includes('FROM companies')) {
            return { rows: [{ plan_id: planId, status: 'ativo', deleted_at: null }] };
          }
          if (text.includes('FROM plans')) {
            return { rows: [plan] };
          }
          return { rows: [] };
        },
      };
      sub.mock.method(db, 'query', () => {
        throw new Error('Consulta fora da transação não permitida.');
      });
      sub.mock.method(
        db,
        'transaction',
        async (
          run: (
            client: Parameters<Parameters<typeof db.transaction>[0]>[0],
          ) => Promise<unknown>,
        ) => {
          events.push('BEGIN');
          try {
            const result = await run(client as never);
            events.push('COMMIT');
            return result;
          } catch (error) {
            events.push('ROLLBACK');
            throw error;
          }
        },
      );

      const result = await salePostgresRepository.createManualSale(operation);
      assert.equal(result.replayed, false);
      assert.equal(result.sale.planId, planId);
      assert.equal(result.sale.planName, 'Plano histórico');
      assert.equal(result.sale.planPrice, '39.90');
      assert.equal(result.sale.amount, '39.90');
      assert.deepEqual(events, ['BEGIN', 'COMMIT']);
      assert.match(queries[0].text, /pg_advisory_xact_lock/);
      assert.match(queries[1].text, /FROM users WHERE id=\$1 FOR UPDATE/);
      assert.match(
        queries[2].text,
        /FROM sales WHERE created_by=\$1 AND operation_id=\$2/,
      );
      assert.match(queries[3].text, /FROM companies WHERE id=\$1 FOR SHARE/);
      assert.match(queries[4].text, /FROM plans WHERE id=\$1 FOR SHARE/);
      const insert = queries.find((query) =>
        query.text.startsWith('INSERT INTO sales'),
      );
      assert.ok(insert);
      assert.deepEqual(insert.values?.slice(2, 10), [
        planId,
        'manual',
        'company_plan',
        'Plano histórico',
        '39.90',
        'monthly',
        '39.90',
        'BRL',
      ]);
      assert.equal(insert.values?.[14], operationId);
      assert.equal(insert.values?.[15], fingerprint);
    },
  );

  await t.test(
    'replay devolve venda original; reuso com fingerprint diferente conflita',
    async (sub) => {
      for (const scenario of ['replay', 'conflict'] as const) {
        await sub.test(scenario, async (nested) => {
          const queries: string[] = [];
          const events: string[] = [];
          const client = {
            async query(text: string) {
              queries.push(text);
              if (text.includes('pg_advisory_xact_lock')) {
                return { rows: [] };
              }
              if (text.includes('FROM users')) {
                return {
                  rows: [{ role: 'super_admin', status: 'active', deleted_at: null }],
                };
              }
              if (text.includes('FROM sales')) {
                return {
                  rows: [
                    saleRow({
                      fingerprint:
                        scenario === 'conflict' ? 'b'.repeat(64) : fingerprint,
                    }),
                  ],
                };
              }
              return { rows: [] };
            },
          };
          nested.mock.method(
            db,
            'transaction',
            async (
              run: (
                client: Parameters<Parameters<typeof db.transaction>[0]>[0],
              ) => Promise<unknown>,
            ) => {
              events.push('BEGIN');
              try {
                const result = await run(client as never);
                events.push('COMMIT');
                return result;
              } catch (error) {
                events.push('ROLLBACK');
                throw error;
              }
            },
          );

          if (scenario === 'replay') {
            const result = await salePostgresRepository.createManualSale(operation);
            assert.equal(result.replayed, true);
            assert.equal(result.sale.id, saleId);
            assert.deepEqual(events, ['BEGIN', 'COMMIT']);
          } else {
            await assert.rejects(
              salePostgresRepository.createManualSale(operation),
              (error) => (error as { status: number }).status === 409,
            );
            assert.deepEqual(events, ['BEGIN', 'ROLLBACK']);
          }
          assert.equal(
            queries.some((query) => query.startsWith('INSERT INTO sales')),
            false,
          );
        });
      }
    },
  );

  await t.test(
    'venda manual com plano vigente continua sem plano no snapshot',
    async (sub) => {
      const queries: { text: string; values?: unknown[] }[] = [];
      const client = {
        async query(text: string, parameters?: unknown[]) {
          queries.push({ text, values: parameters });
          if (text.includes('pg_advisory_xact_lock')) {
            return { rows: [] };
          }
          if (text.includes('FROM users')) {
            return {
              rows: [{ role: 'super_admin', status: 'active', deleted_at: null }],
            };
          }
          if (text.includes('FROM sales')) {
            return { rows: [] };
          }
          if (text.includes('FROM companies')) {
            return { rows: [{ plan_id: planId, status: 'ativo', deleted_at: null }] };
          }
          return { rows: [] };
        },
      };
      sub.mock.method(db, 'query', () => {
        throw new Error('Consulta fora da transação não permitida.');
      });
      sub.mock.method(
        db,
        'transaction',
        async (
          run: (
            client: Parameters<Parameters<typeof db.transaction>[0]>[0],
          ) => Promise<unknown>,
        ) => run(client as never),
      );
      const manual = {
        actorId,
        input: {
          companyId,
          operationId: randomUUID(),
          pricingMode: 'manual_amount' as const,
          amount: '125.50',
          description: 'Valor negociado',
          soldAt: operation.input.soldAt,
        },
        fingerprint,
      };

      const result = await salePostgresRepository.createManualSale(manual);
      assert.equal(result.sale.planId, null);
      assert.equal(result.sale.planPrice, null);
      assert.equal(result.sale.planName, null);
      assert.equal(result.sale.amount, '125.50');
      assert.equal(
        queries.some((query) => query.text.includes('FROM plans')),
        false,
      );
      const insert = queries.find((query) =>
        query.text.startsWith('INSERT INTO sales'),
      );
      assert.ok(insert);
      assert.deepEqual(insert.values?.slice(2, 10), [
        null,
        'manual',
        'manual_amount',
        null,
        null,
        null,
        '125.50',
        'BRL',
      ]);
    },
  );

  await t.test(
    'excluir venda só remove sales e não altera o plano da empresa',
    async (sub) => {
      const queries: string[] = [];
      const events: string[] = [];
      const client = {
        async query(text: string) {
          queries.push(text);
          if (text.includes('pg_advisory_xact_lock')) {
            return { rows: [] };
          }
          if (text.includes('FROM users')) {
            return {
              rows: [{ role: 'super_admin', status: 'active', deleted_at: null }],
            };
          }
          if (text.startsWith('DELETE FROM sales')) {
            return { rows: [{ id: saleId }] };
          }
          return { rows: [] };
        },
      };
      sub.mock.method(
        db,
        'transaction',
        async (
          run: (
            client: Parameters<Parameters<typeof db.transaction>[0]>[0],
          ) => Promise<unknown>,
        ) => {
          events.push('BEGIN');
          try {
            const result = await run(client as never);
            events.push('COMMIT');
            return result;
          } catch (error) {
            events.push('ROLLBACK');
            throw error;
          }
        },
      );

      assert.equal(await salePostgresRepository.deleteSaleById(saleId, actorId), true);
      assert.deepEqual(events, ['BEGIN', 'COMMIT']);
      assert.match(queries[0], /pg_advisory_xact_lock/);
      assert.match(queries[2], /^DELETE FROM sales WHERE id=\$1 RETURNING id$/);
      assert.equal(
        queries.some((query) => /UPDATE companies|DELETE FROM companies/.test(query)),
        false,
      );
    },
  );
});
