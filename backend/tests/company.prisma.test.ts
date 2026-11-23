import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test, { type TestContext } from 'node:test';
import type { Company } from '../src/entities/company.entity.js';
import { Prisma } from '../src/generated/prisma/client.js';

Object.assign(process.env, {
  USE_MOCK_DATA: 'false',
  DATABASE_URL: 'postgresql://localhost:1/civix_test',
  LOG_LEVEL: 'fatal',
});
const { getPrisma } = await import('../src/shared/config/prisma.js');
const { companyRepository: repository } = await import('../src/persistence/index.js');
const prisma = getPrisma();

const companyId = randomUUID();
const actorId = randomUUID();
const operationId = randomUUID();
const planId = 9007199254740993n;
const fingerprint = 'a'.repeat(64);
const timestamp = new Date('2026-11-11T12:00:00.000Z');
const company: Company = {
  id: companyId,
  nome: 'Empresa sintética',
  cnpj: '12345678000199',
  descricao: 'Descrição',
  descricao_detalhada: 'Descrição detalhada',
  categoria: 'Serviços',
  cidade: 'Fortaleza',
  estado: 'CE',
  status: 'ativo',
  verificado: true,
  tamanho: 'pequena',
  faixa_preco: '500-plus',
};
const companyRow = {
  id: companyId,
  name: company.nome,
  cnpj: company.cnpj,
  description: company.descricao,
  detailed_description: company.descricao_detalhada,
  category: company.categoria,
  city: company.cidade,
  state: company.estado,
  status: 'ATIVO',
  size: company.tamanho,
  createdAt: timestamp,
  updatedAt: timestamp,
  plan_id: planId,
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

function mockTransaction<Tx>(t: TestContext, client: Tx) {
  return mockPrismaMethod(
    t,
    prisma,
    '$transaction',
    async (run: (tx: Tx) => Promise<unknown>, _options?: unknown) => run(client),
  );
}

test('lista empresas arquivadas com filtros e faixas na mesma snapshot', async (t) => {
  const count = t.mock.fn(async (_args: Prisma.companiesCountArgs) => 12);
  const findMany = t.mock.fn(async (_args: Prisma.companiesFindManyArgs) => [
    companyRow,
  ]);
  const query = t.mock.fn(async (sql: TemplateStringsArray, ids: string[]) => {
    assert.match(sql.join('?'), /upper_inf\(price_range\).*'500-plus'/);
    assert.match(sql.join('?'), /ANY\(\?::uuid\[\]\)/);
    assert.deepEqual(ids, [companyId]);
    return [{ id: companyId, price_range: '500-plus' }];
  });
  const transaction = mockTransaction(t, {
    companies: { count, findMany },
    $queryRaw: query,
  });
  const result = await repository.listPlatformCompanies({
    q: '100%_',
    planId: String(planId),
    status: 'archived',
    pageSize: 5,
    offset: 10,
  });

  const where = {
    OR: [
      { name: { contains: '100\\%\\_', mode: 'insensitive' } },
      { cnpj: { contains: '100\\%\\_', mode: 'insensitive' } },
    ],
    plan_id: planId,
    deleted_at: { not: null },
  };
  assert.deepEqual(transaction.mock.calls[0].arguments[1], {
    isolationLevel: 'RepeatableRead',
  });
  assert.deepEqual(count.mock.calls[0].arguments, [{ where }]);
  assert.deepEqual(findMany.mock.calls[0].arguments, [
    {
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: 5,
      skip: 10,
    },
  ]);
  assert.equal(result.total, 12);
  assert.equal(result.items[0].faixa_preco, '500-plus');
  assert.equal(result.items[0].plan_id, String(planId));
});

test('busca pública cruza numrange com UF e situação ativa', async (t) => {
  const findMany = t.mock.fn(async (_args: Prisma.companiesFindManyArgs) => [
    companyRow,
  ]);
  const query = t.mock.fn(
    async (sql: TemplateStringsArray, param: string | string[]) => {
      if (typeof param === 'string') {
        assert.match(sql.join('?'), /price_range && \?::numrange/);
        assert.equal(param, '[100,300]');
        return [{ id: companyId }];
      }
      assert.deepEqual(param, [companyId]);
      return [{ id: companyId, price_range: '100-300' }];
    },
  );
  mockTransaction(t, { companies: { findMany }, $queryRaw: query });

  const result = await repository.searchPublicCompanies({
    uf: 'CE',
    priceRange: '100-300',
  });
  assert.deepEqual(findMany.mock.calls[0].arguments[0].where, {
    deleted_at: null,
    status: { not: 'INATIVO' },
    id: { in: [companyId] },
    state: { equals: 'CE', mode: 'insensitive' },
  });
  assert.equal(query.mock.callCount(), 2);
  assert.equal(result[0].faixa_preco, '100-300');
});

test('cadastro registra empresa, faixa e venda uma vez e reapresenta a operação original', async (t) => {
  type OperationData = Prisma.company_registration_operationsUncheckedCreateInput;
  type SaleData = Prisma.salesUncheckedCreateInput;
  let savedOperation: OperationData | undefined;
  let savedSale: SaleData | undefined;
  const execute = t.mock.fn(
    async (_sql: TemplateStringsArray, ..._values: unknown[]) => {},
  );
  const createCompany = t.mock.fn(
    async (_args: Prisma.companiesCreateArgs) => companyRow,
  );
  const createSale = t.mock.fn(async ({ data }: { data: SaleData }) => {
    savedSale = data;
  });
  const createOperation = t.mock.fn(async ({ data }: { data: OperationData }) => {
    savedOperation = data;
  });
  const findOperation = t.mock.fn(
    async (_args: Prisma.company_registration_operationsFindUniqueArgs) =>
      savedOperation,
  );
  const findSale = t.mock.fn(async (_args: Prisma.salesFindUniqueArgs) => {
    assert.ok(savedSale);
    return {
      ...savedSale,
      amount: new Prisma.Decimal(String(savedSale.amount)),
      plan_price: new Prisma.Decimal(String(savedSale.plan_price)),
    };
  });
  mockTransaction(t, {
    $executeRaw: execute,
    $queryRaw: async (sql: TemplateStringsArray) =>
      sql.join('').includes('AS price_range')
        ? [{ id: companyId, price_range: '500-plus' }]
        : [],
    companies: { create: createCompany, findUnique: async () => companyRow },
    sales: { create: createSale, findUnique: findSale },
    company_registration_operations: {
      create: createOperation,
      findUnique: findOperation,
    },
    users: { findUnique: async () => ({ role: 'SUPER_ADMIN', status: 'ACTIVE' }) },
    plans: {
      findUnique: async () => ({
        id: planId,
        name: 'Plano sintético',
        price: new Prisma.Decimal('39.90'),
        billing_period: 'monthly',
        is_active: true,
      }),
    },
  });
  const input = { company, actorId, operationId, fingerprint, planId: String(planId) };
  const created = await repository.createCompanyWithInitialSale(input);
  const replay = await repository.createCompanyWithInitialSale(input);

  assert.equal(created.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.company.faixa_preco, '500-plus');
  assert.equal(replay.sale.id, created.sale.id);
  assert.equal(replay.sale.amount, '39.90');
  assert.equal(createCompany.mock.callCount(), 1);
  assert.equal(createSale.mock.callCount(), 1);
  assert.equal(createOperation.mock.callCount(), 1);
  assert.deepEqual(findOperation.mock.calls[0].arguments[0].where, {
    actor_id_operation_id: { actor_id: actorId, operation_id: operationId },
  });
  assert.deepEqual(findSale.mock.calls[0].arguments[0].where, {
    id: created.sale.id,
  });
  const [lockSql, lockKey] = execute.mock.calls[0].arguments;
  assert.match(lockSql.join('?'), /pg_advisory_xact_lock/);
  assert.equal(lockKey, actorId + ':' + operationId);
  const [rangeSql, range, rangeId] = execute.mock.calls[1].arguments;
  assert.match(rangeSql.join('?'), /price_range = \?::numrange/);
  assert.equal(range, '[500,)');
  assert.equal(rangeId, companyId);

  await assert.rejects(
    repository.createCompanyWithInitialSale({ ...input, fingerprint: 'b'.repeat(64) }),
    { status: 409 },
  );
  assert.equal(createOperation.mock.callCount(), 1);
});

test('troca capa e logo com comparação atômica da chave anterior', async (t) => {
  const update = mockPrismaMethod(
    t,
    prisma.companies,
    'updateMany',
    async ({ where }: Prisma.companiesUpdateManyArgs) => ({
      count: where?.cover_key === null ? 1 : 0,
    }),
  );
  assert.equal(await repository.updateCoverKey(companyId, 'new-cover', null), true);
  assert.equal(await repository.updateLogoKey(companyId, null, 'stale-logo'), false);
  const eligible = { id: companyId, deleted_at: null, status: { not: 'INATIVO' } };
  assert.deepEqual(
    update.mock.calls.map(({ arguments: args }) => args[0]),
    [
      { where: { ...eligible, cover_key: null }, data: { cover_key: 'new-cover' } },
      { where: { ...eligible, logo_key: 'stale-logo' }, data: { logo_key: null } },
    ],
  );
});
