import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { Prisma } from '../src/generated/prisma/client.js';
Object.assign(process.env, {
  USE_MOCK_DATA: 'false',
  DATABASE_URL: 'postgresql://localhost:1/civix_test',
  LOG_LEVEL: 'fatal',
});
const { getPrisma } = await import('../src/shared/config/prisma.js');
const { companyPostgresRepository } =
  await import('../src/persistence/postgres/company.repository.js');
const prisma = getPrisma();
const company = {
  id: randomUUID(),
  nome: 'Empresa sintética',
  cnpj: '12345678000190',
  descricao: '',
  descricao_detalhada: '',
  categoria: 'Tecnologia',
  cidade: 'Fortaleza',
  estado: 'CE',
  status: 'ativo' as const,
  verificado: false,
  tamanho: 'pequena' as const,
};
const input = {
  company,
  planId: '9007199254740993123',
  actorId: randomUUID(),
  operationId: randomUUID(),
  fingerprint: 'a'.repeat(64),
};
const plan = {
  id: BigInt(input.planId),
  name: 'Plano sintético',
  price: new Prisma.Decimal('39.90'),
  billing_period: 'monthly',
  is_active: true,
};

test('cadastro PostgreSQL usa delegates e locks na mesma transação simulada', async (t) => {
  for (const scenario of [
    'new',
    'replay',
    'conflict',
    'missing-sale',
    'inactive',
    'revoked',
    'insert-failure',
    'unique-failure',
  ] as const) {
    await t.test(scenario, async (sub) => {
      const events: string[] = [];
      const failure = new Error('Falha sintética na venda');
      const saleId = randomUUID();
      const timestamp = new Date('2026-11-11T12:00:00.000Z');
      const fake = {
        async $executeRaw(sql: TemplateStringsArray, ...values: unknown[]) {
          const statement = sql.join('?');
          if (statement.includes('pg_advisory_xact_lock')) {
            events.push('lockOperation');
            assert.deepEqual(values, [input.actorId + ':' + input.operationId]);
          } else {
            events.push('writeRange');
            assert.match(statement, /price_range = \?::numrange/);
            assert.deepEqual(values, [null, company.id]);
          }
        },
        async $queryRaw(sql: TemplateStringsArray, value: unknown) {
          const statement = sql.join('?');
          if (statement.includes('FROM users')) {
            events.push('lockActor');
            assert.match(statement, /SELECT id .*FOR SHARE/);
            assert.equal(value, input.actorId);
            return [{ id: input.actorId }];
          }
          if (statement.includes('FROM plans')) {
            events.push('lockPlan');
            assert.match(statement, /SELECT id .*FOR SHARE/);
            assert.equal(value, plan.id);
            return [{ id: plan.id }];
          }
          events.push('readRange');
          assert.match(statement, /AS price_range/);
          return [{ id: company.id, price_range: null }];
        },
        company_registration_operations: {
          async findUnique(args: Prisma.company_registration_operationsFindUniqueArgs) {
            events.push('findOperation');
            assert.deepEqual(args.where, {
              actor_id_operation_id: {
                actor_id: input.actorId,
                operation_id: input.operationId,
              },
            });
            if (['replay', 'conflict', 'missing-sale'].includes(scenario)) {
              return {
                fingerprint:
                  scenario === 'conflict' ? 'b'.repeat(64) : input.fingerprint,
                company_id: company.id,
                sale_id: saleId,
              };
            }
            return null;
          },
          create: sub.mock.fn(
            async (_args: Prisma.company_registration_operationsCreateArgs) => {
              events.push('createOperation');
            },
          ),
        },
        users: {
          async findUnique(args: Prisma.usersFindUniqueArgs) {
            events.push('readActor');
            assert.deepEqual(args.where, { id: input.actorId });
            return {
              role: scenario === 'revoked' ? 'ADMIN_EMPRESA' : 'SUPER_ADMIN',
              status: 'ACTIVE',
            };
          },
        },
        plans: {
          async findUnique(args: Prisma.plansFindUniqueArgs) {
            events.push('readPlan');
            assert.deepEqual(args.where, { id: plan.id });
            return { ...plan, is_active: scenario !== 'inactive' };
          },
        },
        companies: {
          async findUnique(args: Prisma.companiesFindUniqueArgs) {
            events.push('readCompany');
            assert.deepEqual(args.where, { id: company.id });
            return {
              id: company.id,
              status: 'ATIVO',
              createdAt: timestamp,
              updatedAt: timestamp,
              plan_id: plan.id,
            };
          },
          create: sub.mock.fn(async (_args: Prisma.companiesCreateArgs) => {
            events.push('createCompany');
            if (scenario === 'unique-failure') {
              throw Object.assign(new Error('Duplicidade sintética'), {
                code: 'P2002',
              });
            }
          }),
        },
        sales: {
          async findUnique(args: Prisma.salesFindUniqueArgs) {
            events.push('readSale');
            assert.deepEqual(args.where, { id: saleId });
            if (scenario === 'missing-sale') {
              return null;
            }
            return {
              id: saleId,
              company_id: company.id,
              plan_id: plan.id,
              origin: 'company_creation',
              pricing_mode: 'company_plan',
              plan_name: plan.name,
              plan_price: plan.price,
              plan_billing_period: 'monthly',
              amount: plan.price,
              currency: 'BRL',
              description: null,
              sold_at: timestamp,
              created_at: timestamp,
              created_by: input.actorId,
            };
          },
          create: sub.mock.fn(async (_args: Prisma.salesCreateArgs) => {
            events.push('createSale');
            if (scenario === 'insert-failure') {
              throw failure;
            }
          }),
        },
      };
      const originalTransaction = prisma.$transaction;
      const transaction = async (run: (client: typeof fake) => Promise<unknown>) => {
        events.push('BEGIN');
        try {
          const result = await run(fake);
          events.push('COMMIT');
          return result;
        } catch (error) {
          events.push('ROLLBACK');
          throw error;
        }
      };
      prisma.$transaction = transaction as unknown as typeof prisma.$transaction;
      sub.after(() => {
        prisma.$transaction = originalTransaction;
      });

      if (scenario === 'new' || scenario === 'replay') {
        const result =
          await companyPostgresRepository.createCompanyWithInitialSale(input);
        assert.equal(result.replayed, scenario === 'replay');
        assert.equal(result.sale.amount, '39.90');
        assert.equal(result.sale.planId, input.planId);
      } else {
        await assert.rejects(
          companyPostgresRepository.createCompanyWithInitialSale(input),
          (error) =>
            scenario === 'insert-failure'
              ? error === failure
              : (error as { status: number }).status ===
                (scenario === 'inactive' ? 400 : scenario === 'revoked' ? 403 : 409),
        );
      }

      const actorChecks = ['lockActor', 'readActor'];
      const planChecks = ['lockPlan', 'readPlan'];
      const reads = ['readCompany', 'readSale'];
      const expectedEvents = {
        new: [
          ...actorChecks,
          ...planChecks,
          'createCompany',
          'writeRange',
          'createSale',
          'createOperation',
          'COMMIT',
        ],
        replay: [...reads, 'readRange', 'COMMIT'],
        conflict: ['ROLLBACK'],
        'missing-sale': [...reads, 'ROLLBACK'],
        inactive: [...actorChecks, ...planChecks, 'ROLLBACK'],
        revoked: [...actorChecks, 'ROLLBACK'],
        'insert-failure': [
          ...actorChecks,
          ...planChecks,
          'createCompany',
          'writeRange',
          'createSale',
          'ROLLBACK',
        ],
        'unique-failure': [...actorChecks, ...planChecks, 'createCompany', 'ROLLBACK'],
      };
      assert.deepEqual(events, [
        'BEGIN',
        'lockOperation',
        'findOperation',
        ...expectedEvents[scenario],
      ]);

      if (scenario === 'new') {
        const companyData = fake.companies.create.mock.calls[0].arguments[0].data;
        const saleData = fake.sales.create.mock.calls[0].arguments[0].data;
        const operationData =
          fake.company_registration_operations.create.mock.calls[0].arguments[0].data;
        assert.equal('plan_id' in companyData && companyData.plan_id, plan.id);
        assert.equal(saleData.amount, '39.90');
        assert.equal('sale_id' in operationData && operationData.sale_id, saleData.id);
      }
    });
  }
});
