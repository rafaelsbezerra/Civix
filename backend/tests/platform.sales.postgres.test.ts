import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test, { type TestContext } from 'node:test';
import { Prisma } from '../src/generated/prisma/client.js';
import type { PlanRow } from '../src/interfaces/plan.row.js';

Object.assign(process.env, {
  USE_MOCK_DATA: 'false',
  DATABASE_URL: 'postgresql://localhost:1/civix_test',
  LOG_LEVEL: 'fatal',
});
const { getPrisma } = await import('../src/shared/config/prisma.js');
const { salePostgresRepository } =
  await import('../src/persistence/postgres/sale.repository.js');
const prisma = getPrisma();

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
const soldAt = '2026-11-01T12:00:00.000Z';
const row = {
  id: saleId,
  company_id: companyId,
  plan_id: BigInt(planId),
  origin: 'manual',
  pricing_mode: 'company_plan',
  plan_name: plan.name,
  plan_price: new Prisma.Decimal('39.90'),
  plan_billing_period: 'monthly',
  amount: new Prisma.Decimal('39.90'),
  currency: 'BRL',
  description: 'Venda sintética',
  sold_at: new Date(soldAt),
  created_at: new Date(soldAt),
  created_by: actorId,
  operation_id: operationId,
  fingerprint,
};
const operation = {
  actorId,
  input: {
    companyId,
    operationId,
    pricingMode: 'company_plan' as const,
    description: 'Venda sintética',
    soldAt,
  },
  fingerprint,
};

function mockPrismaMethod<
  Target,
  Key extends keyof Target,
  Args extends unknown[],
  Result,
>(t: TestContext, target: Target, key: Key, implementation: (...args: Args) => Result) {
  const original = target[key];
  const mock = t.mock.fn(implementation);
  target[key] = mock as Target[Key];
  t.after(() => {
    target[key] = original;
  });
  return mock;
}

function mockWriteTransaction(t: TestContext, previous: typeof row | null = null) {
  const events: string[] = [];
  const client = {
    $executeRaw: t.mock.fn(async (query: TemplateStringsArray) => {
      events.push('advisoryLock');
      assert.match(
        query.join(''),
        /pg_advisory_xact_lock.*civix:platform-administration/,
      );
    }),
    $queryRaw: t.mock.fn(async (query: TemplateStringsArray, id: string | bigint) => {
      const sql = query.join('?');
      if (sql.includes('FROM users')) {
        events.push('actorLock');
        assert.match(sql, /WHERE id = \?::uuid\s+FOR UPDATE/);
        assert.equal(id, actorId);
        return [{ id: actorId }];
      }
      if (sql.includes('FROM companies')) {
        events.push('companyLock');
        assert.match(sql, /WHERE id = \?::uuid\s+FOR SHARE/);
        assert.equal(id, companyId);
        return [{ id: companyId }];
      }
      assert.match(sql, /FROM plans\s+WHERE id = \?\s+FOR SHARE/);
      assert.equal(id, BigInt(planId));
      events.push('planLock');
      return [{ id: BigInt(planId) }];
    }),
    users: {
      async findUnique(args: Prisma.usersFindUniqueArgs) {
        assert.equal(events.at(-1), 'actorLock');
        assert.deepEqual(args.where, { id: actorId });
        return { role: 'SUPER_ADMIN', status: 'ACTIVE', deleted_at: null };
      },
    },
    companies: {
      async findUnique(args: Prisma.companiesFindUniqueArgs) {
        assert.equal(events.at(-1), 'companyLock');
        assert.deepEqual(args.where, { id: companyId });
        return { plan_id: BigInt(planId), status: 'ATIVO', deleted_at: null };
      },
    },
    plans: {
      async findUnique(args: Prisma.plansFindUniqueArgs) {
        assert.equal(events.at(-1), 'planLock');
        assert.deepEqual(args.where, { id: BigInt(planId) });
        return { ...plan, id: BigInt(planId), price: new Prisma.Decimal(plan.price) };
      },
    },
    sales: {
      findFirst: t.mock.fn(async (args: Prisma.salesFindFirstArgs) => {
        events.push('findFirst');
        assert.deepEqual(args.where, {
          created_by: actorId,
          operation_id: operationId,
        });
        return previous;
      }),
      create: t.mock.fn(async (_args: Prisma.salesCreateArgs) => {
        events.push('create');
      }),
      deleteMany: t.mock.fn(async (_args: Prisma.salesDeleteManyArgs) => {
        events.push('deleteMany');
        return { count: 1 };
      }),
    },
  };
  mockPrismaMethod(
    t,
    prisma,
    '$transaction',
    async (run: (tx: typeof client) => Promise<unknown>) => {
      events.push('BEGIN');
      try {
        const result = await run(client);
        events.push('COMMIT');
        return result;
      } catch (error) {
        events.push('ROLLBACK');
        throw error;
      }
    },
  );
  return { client, events };
}

test('lista filtra, pagina em ordem estável e converte valores monetários para texto', async (t) => {
  const findMany = mockPrismaMethod(
    t,
    prisma.sales,
    'findMany',
    async (_args: Prisma.salesFindManyArgs) => [
      { ...row, companies: { name: 'Empresa sintética' } },
    ],
  );
  const count = mockPrismaMethod(
    t,
    prisma.sales,
    'count',
    async (_args: Prisma.salesCountArgs) => 7,
  );
  const transaction = mockPrismaMethod(
    t,
    prisma,
    '$transaction',
    async (queries: Promise<unknown>[], _options: unknown) => Promise.all(queries),
  );

  const from = '2026-10-01T00:00:00.000Z';
  const to = '2026-11-30T23:59:59.000Z';
  const result = await salePostgresRepository.listPlatformSales({
    companyId,
    planId,
    origin: 'manual',
    from,
    to,
    pageSize: 5,
    offset: 10,
  });

  const where = {
    company_id: companyId,
    plan_id: BigInt(planId),
    origin: 'manual',
    sold_at: { gte: new Date(from), lte: new Date(to) },
  };
  assert.deepEqual(count.mock.calls[0].arguments, [{ where }]);
  assert.deepEqual(findMany.mock.calls[0].arguments, [
    {
      where,
      include: { companies: { select: { name: true } } },
      orderBy: [{ sold_at: 'desc' }, { id: 'asc' }],
      skip: 10,
      take: 5,
    },
  ]);
  assert.deepEqual(transaction.mock.calls[0].arguments[1], {
    isolationLevel: 'RepeatableRead',
  });
  assert.equal(result.total, 7);
  assert.equal(result.items[0].planId, planId);
  assert.equal(result.items[0].amount, '39.90');
  assert.equal(result.items[0].planPrice, '39.90');
  assert.equal(result.items[0].companyName, 'Empresa sintética');
});

test('cria snapshot do plano em transação com locks e mantém a operação', async (t) => {
  const { client, events } = mockWriteTransaction(t);
  const result = await salePostgresRepository.createManualSale(operation);

  assert.equal(result.replayed, false);
  assert.equal(result.sale.planId, planId);
  assert.equal(result.sale.planName, 'Plano histórico');
  assert.equal(result.sale.planPrice, '39.90');
  assert.equal(result.sale.amount, '39.90');
  assert.deepEqual(events, [
    'BEGIN',
    'advisoryLock',
    'actorLock',
    'findFirst',
    'companyLock',
    'planLock',
    'create',
    'COMMIT',
  ]);
  assert.deepEqual(client.sales.create.mock.calls[0].arguments[0].data, {
    ...row,
    id: result.sale.id,
    plan_price: '39.90',
    amount: '39.90',
    sold_at: soldAt,
    created_at: result.sale.createdAt,
  });
});

test('replay devolve venda original; fingerprint diferente conflita', async (t) => {
  await t.test('replay', async (sub) => {
    const { events } = mockWriteTransaction(sub, row);
    const result = await salePostgresRepository.createManualSale(operation);
    assert.equal(result.replayed, true);
    assert.equal(result.sale.id, saleId);
    assert.deepEqual(events, [
      'BEGIN',
      'advisoryLock',
      'actorLock',
      'findFirst',
      'COMMIT',
    ]);
  });

  await t.test('conflito', async (sub) => {
    const { events } = mockWriteTransaction(sub, {
      ...row,
      fingerprint: 'b'.repeat(64),
    });
    await assert.rejects(
      salePostgresRepository.createManualSale(operation),
      (error) => (error as { status: number }).status === 409,
    );
    assert.deepEqual(events, [
      'BEGIN',
      'advisoryLock',
      'actorLock',
      'findFirst',
      'ROLLBACK',
    ]);
  });
});

test('venda com valor manual continua sem plano no snapshot', async (t) => {
  const { client, events } = mockWriteTransaction(t);
  const manual = {
    ...operation,
    input: {
      ...operation.input,
      pricingMode: 'manual_amount' as const,
      amount: '125.50',
      description: 'Valor negociado',
    },
  };

  const result = await salePostgresRepository.createManualSale(manual);
  assert.equal(result.sale.planId, null);
  assert.equal(result.sale.planPrice, null);
  assert.equal(result.sale.planName, null);
  assert.equal(result.sale.amount, '125.50');
  assert.deepEqual(events, [
    'BEGIN',
    'advisoryLock',
    'actorLock',
    'findFirst',
    'companyLock',
    'create',
    'COMMIT',
  ]);
  assert.deepEqual(client.sales.create.mock.calls[0].arguments[0].data, {
    ...row,
    id: result.sale.id,
    plan_id: null,
    pricing_mode: 'manual_amount',
    plan_name: null,
    plan_price: null,
    plan_billing_period: null,
    amount: '125.50',
    description: manual.input.description,
    sold_at: soldAt,
    created_at: result.sale.createdAt,
  });
});

test('exclusão remove somente a venda', async (t) => {
  const { client, events } = mockWriteTransaction(t);

  assert.equal(await salePostgresRepository.deleteSaleById(saleId, actorId), true);
  assert.deepEqual(events, [
    'BEGIN',
    'advisoryLock',
    'actorLock',
    'deleteMany',
    'COMMIT',
  ]);
  assert.deepEqual(client.sales.deleteMany.mock.calls[0].arguments, [
    { where: { id: saleId } },
  ]);
});
