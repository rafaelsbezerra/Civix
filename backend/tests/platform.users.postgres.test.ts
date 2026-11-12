import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test, { type TestContext } from 'node:test';
import type { Prisma, users } from '../src/generated/prisma/client.js';
import type { UserAdministrationChange } from '../src/dtos/user.auth.dto.js';

Object.assign(process.env, {
  USE_MOCK_DATA: 'false',
  DATABASE_URL: 'postgresql://localhost:1/civix_test',
  LOG_LEVEL: 'fatal',
});
const { getPrisma } = await import('../src/shared/config/prisma.js');
const { userPostgresRepository } =
  await import('../src/persistence/postgres/user.repository.js');
const { authPostgresRepository } =
  await import('../src/persistence/postgres/auth.repository.js');
const prisma = getPrisma();

const actorId = randomUUID();
const targetId = randomUUID();
const companyId = randomUUID();
const changedAt = '2026-11-02T12:00:00.000Z';

function makeUser(overrides: Partial<users> = {}): users {
  return {
    id: targetId,
    email: 'target@example.test',
    name: 'Pessoa Alvo',
    role: 'ADMIN_EMPRESA',
    company_id: companyId,
    password_hash: 'hash-sintetico',
    status: 'ACTIVE',
    deleted_at: null,
    deactivation_reason: null,
    tokens_revoked_at: new Date(changedAt),
    invite_token: 'convite-antigo',
    reset_password_token: 'reset-antigo',
    reset_password_expires: new Date(changedAt),
    plan_id: null,
    createdAt: new Date(changedAt),
    updatedAt: new Date(changedAt),
    ...overrides,
  };
}

const actor = makeUser({ id: actorId, role: 'SUPER_ADMIN', company_id: null });
const company = { status: 'ATIVO', deleted_at: null };

function change(
  overrides: Partial<UserAdministrationChange> = {},
): UserAdministrationChange {
  return {
    actorId,
    companyId,
    userId: targetId,
    action: 'suspend',
    reason: 'Motivo sintético',
    changedAt,
    ...overrides,
  };
}

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

function mockTransaction(
  t: TestContext,
  options: {
    actor?: users;
    target?: users;
    companyStatus?: string;
    activeAdminCount?: number;
  } = {},
) {
  const events: string[] = [];
  const target = options.target ?? makeUser();
  const tx = {
    $executeRaw: t.mock.fn(
      async (query: TemplateStringsArray, ..._values: unknown[]) => {
        events.push(
          query.join('?').includes('pg_advisory_xact_lock') ? 'LOCK' : 'REVOKE',
        );
        return 1;
      },
    ),
    $queryRaw: t.mock.fn(async (query: TemplateStringsArray, ...values: unknown[]) => {
      const sql = query.join('?');
      if (sql.includes('FROM companies')) {
        events.push('COMPANY');
        return [{ id: companyId }];
      }
      if (sql.includes('LOWER(email)')) {
        events.push('EMAIL');
        return options.target ? [{ id: options.target.id }] : [];
      }
      if (sql.includes("role = 'SUPER_ADMIN'")) {
        events.push('ACTIVE_ADMINS');
        return [actor, target].slice(0, options.activeAdminCount ?? 2);
      }
      if (values[0] === actorId) {
        events.push('ACTOR');
        return [{ id: actorId }];
      }
      events.push('TARGET');
      return [{ id: targetId }];
    }),
    companies: {
      findUnique: async () => ({
        ...company,
        status: options.companyStatus ?? company.status,
      }),
    },
    users: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === actorId ? (options.actor ?? actor) : target,
      update: t.mock.fn(async ({ data }: { data: Partial<users> }) => {
        events.push('UPDATE');
        return { ...target, ...data };
      }),
      create: t.mock.fn(async ({ data }: { data: Partial<users> }) => {
        events.push('CREATE');
        return makeUser(data);
      }),
      updateMany: t.mock.fn(async (_args: Prisma.usersUpdateManyArgs) => {
        events.push('UPDATE_MANY');
        return { count: options.companyStatus === 'INATIVO' ? 0 : 1 };
      }),
    },
  };
  mockPrismaMethod(
    t,
    prisma,
    '$transaction',
    async (run: (client: typeof tx) => Promise<unknown>) => {
      events.push('BEGIN');
      try {
        const result = await run(tx);
        events.push('COMMIT');
        return result;
      } catch (error) {
        events.push('ROLLBACK');
        throw error;
      }
    },
  );
  return { events, tx };
}

test('lista usuários no escopo, com busca literal e paginação consistente', async (t) => {
  const find = mockPrismaMethod(
    t,
    prisma.users,
    'findMany',
    async (_args: Prisma.usersFindManyArgs) => [
      makeUser({ role: 'ATENDENTE', status: 'BLOCKED' }),
    ],
  );
  const count = mockPrismaMethod(
    t,
    prisma.users,
    'count',
    async (_args: Prisma.usersCountArgs) => 9,
  );
  const transaction = mockPrismaMethod(
    t,
    prisma,
    '$transaction',
    (operations: Promise<unknown>[], _options: { isolationLevel: string }) =>
      Promise.all(operations),
  );

  const result = await userPostgresRepository.getUsersForAdministration(companyId, {
    q: 'ana%_',
    role: 'atendente',
    status: 'blocked',
    pageSize: 5,
    offset: 10,
  });
  const where = {
    company_id: companyId,
    deleted_at: null,
    role: { in: ['ADMIN_EMPRESA', 'ATENDENTE'] },
    AND: { role: 'ATENDENTE' },
    status: 'BLOCKED',
    OR: [
      { email: { contains: 'ana\\%\\_', mode: 'insensitive' } },
      { name: { contains: 'ana\\%\\_', mode: 'insensitive' } },
    ],
  };
  assert.deepEqual(find.mock.calls[0].arguments[0], {
    where,
    orderBy: [{ email: 'asc' }, { id: 'asc' }],
    take: 5,
    skip: 10,
  });
  assert.deepEqual(count.mock.calls[0].arguments[0], { where });
  assert.deepEqual(transaction.mock.calls[0].arguments[1], {
    isolationLevel: 'RepeatableRead',
  });
  assert.equal(result.total, 9);
  assert.equal(result.items[0].role, 'atendente');
  assert.equal(result.items[0].status, 'blocked');

  await userPostgresRepository.getUsersForAdministration(null, {
    pageSize: 20,
    offset: 0,
  });
  assert.deepEqual(find.mock.calls[1].arguments[0].where, {
    company_id: null,
    deleted_at: null,
    role: { in: ['SUPER_ADMIN'] },
  });
});

test('suspende superadmin e revoga tokens na transação que bloqueia ator e alvo', async (t) => {
  const target = makeUser({ role: 'SUPER_ADMIN', company_id: null });
  const { tx, events } = mockTransaction(t, { target });
  const result = await userPostgresRepository.changeUserAdministration(
    change({ companyId: null }),
  );
  assert.equal(result.status, 'blocked');
  assert.deepEqual(events, [
    'BEGIN',
    'LOCK',
    'ACTOR',
    'TARGET',
    'ACTIVE_ADMINS',
    'REVOKE',
    'UPDATE',
    'COMMIT',
  ]);
  const [lock] = tx.$executeRaw.mock.calls[0].arguments;
  assert.match(lock.join('?'), /pg_advisory_xact_lock.*civix:platform-administration/);
  for (const [call, id] of [
    [0, actorId],
    [1, targetId],
  ] as const) {
    const [query, parameter] = tx.$queryRaw.mock.calls[call].arguments;
    assert.match(query.join('?'), /WHERE id = \?::uuid FOR UPDATE/);
    assert.equal(parameter, id);
  }
  assert.match(
    tx.$queryRaw.mock.calls[2].arguments[0].join('?'),
    /status = 'ACTIVE'\s+FOR UPDATE/,
  );
  const [revoke, now, id] = tx.$executeRaw.mock.calls[1].arguments;
  assert.match(
    revoke.join('?'),
    /GREATEST\([\s\S]*clock_timestamp\(\)[\s\S]*INTERVAL '2 milliseconds'/,
  );
  assert.ok(now instanceof Date);
  assert.equal(id, targetId);
  assert.deepEqual(tx.users.update.mock.calls[0].arguments[0], {
    where: { id: targetId },
    data: {
      status: 'BLOCKED',
      deactivation_reason: 'Motivo sintético',
      invite_token: null,
      reset_password_token: null,
      reset_password_expires: null,
    },
  });
});

test('revalida ator, último superadmin e empresa antes de gravar', async (t) => {
  await t.test('último superadmin', async (sub) => {
    const target = makeUser({ role: 'SUPER_ADMIN', company_id: null });
    const { events } = mockTransaction(sub, { target, activeAdminCount: 1 });
    await assert.rejects(
      userPostgresRepository.changeUserAdministration(change({ companyId: null })),
      { status: 409 },
    );
    assert.deepEqual(events, [
      'BEGIN',
      'LOCK',
      'ACTOR',
      'TARGET',
      'ACTIVE_ADMINS',
      'ROLLBACK',
    ]);
  });
  await t.test('ator fora do escopo', async (sub) => {
    const { events } = mockTransaction(sub, { actor: makeUser({ id: actorId }) });
    await assert.rejects(userPostgresRepository.changeUserAdministration(change()), {
      status: 403,
    });
    assert.deepEqual(events, ['BEGIN', 'LOCK', 'ACTOR', 'ROLLBACK']);
  });
  await t.test('empresa inativa', async (sub) => {
    const { tx, events } = mockTransaction(sub, { companyStatus: 'INATIVO' });
    await assert.rejects(userPostgresRepository.changeUserAdministration(change()), {
      status: 409,
    });
    assert.deepEqual(events, ['BEGIN', 'LOCK', 'ACTOR', 'COMPANY', 'ROLLBACK']);
    const [query, parameter] = tx.$queryRaw.mock.calls[1].arguments;
    assert.match(query.join('?'), /FROM companies WHERE id = \?::uuid FOR SHARE/);
    assert.equal(parameter, companyId);
  });
});

test('exclui atendente logicamente e mantém vínculo e motivo', async (t) => {
  const target = makeUser({ role: 'ATENDENTE' });
  const { tx, events } = mockTransaction(t, { target });
  const result = await userPostgresRepository.changeUserAdministration(
    change({ action: 'delete' }),
  );
  const { data } = tx.users.update.mock.calls[0].arguments[0];
  assert.equal(result.status, 'blocked');
  assert.equal(result.company_id, companyId);
  assert.equal(result.deactivation_reason, 'Motivo sintético');
  assert.equal(result.deleted_at, data.deleted_at?.toISOString());
  assert.ok(Math.abs(Date.parse(result.deleted_at!) - Date.now()) < 5000);
  assert.deepEqual(events, [
    'BEGIN',
    'LOCK',
    'ACTOR',
    'COMPANY',
    'TARGET',
    'REVOKE',
    'UPDATE',
    'COMMIT',
  ]);
});

test('reativa conta sem senha como pendente e limpa o convite', async (t) => {
  const target = makeUser({
    role: 'ATENDENTE',
    status: 'BLOCKED',
    password_hash: null,
  });
  const { tx, events } = mockTransaction(t, { target });
  const result = await userPostgresRepository.changeUserAdministration(
    change({ action: 'reactivate' }),
  );
  assert.equal(result.status, 'pending');
  assert.deepEqual(tx.users.update.mock.calls[0].arguments[0], {
    where: { id: targetId },
    data: { status: 'PENDING', invite_token: null },
  });
  assert.deepEqual(events, [
    'BEGIN',
    'LOCK',
    'ACTOR',
    'COMPANY',
    'TARGET',
    'UPDATE',
    'COMMIT',
  ]);
});

test('convida superadmin sem vínculo e recusa reconvite anterior à revogação', async (t) => {
  await t.test('convite global', async (sub) => {
    const { tx, events } = mockTransaction(sub);
    const result = await userPostgresRepository.changeUserAdministration(
      change({
        companyId: null,
        action: 'invite',
        email: 'novo-super@example.test',
        name: 'Novo Super',
        role: 'super_admin',
        token: 'token-sintetico',
      }),
    );
    assert.equal(result.role, 'super_admin');
    assert.equal(result.company_id, null);
    const [query, email] = tx.$queryRaw.mock.calls[1].arguments;
    assert.match(query.join('?'), /LOWER\(email\) = LOWER\(\?\) FOR UPDATE/);
    assert.equal(email, 'novo-super@example.test');
    const { data } = tx.users.create.mock.calls[0].arguments[0];
    assert.deepEqual(data, {
      id: result.id,
      email: 'novo-super@example.test',
      name: 'Novo Super',
      role: 'SUPER_ADMIN',
      company_id: null,
      status: 'PENDING',
      invite_token: 'token-sintetico',
    });
    assert.deepEqual(events, ['BEGIN', 'LOCK', 'ACTOR', 'EMAIL', 'CREATE', 'COMMIT']);
  });

  await t.test('reconvite obsoleto', async (sub) => {
    const target = makeUser({ role: 'ATENDENTE', status: 'PENDING' });
    const { events } = mockTransaction(sub, { target });
    await assert.rejects(
      userPostgresRepository.changeUserAdministration(
        change({
          action: 'invite',
          email: target.email,
          role: 'atendente',
          token: 'token-antigo',
          tokenIssuedAt: changedAt,
        }),
      ),
      { status: 409 },
    );
    assert.deepEqual(events, [
      'BEGIN',
      'LOCK',
      'ACTOR',
      'COMPANY',
      'EMAIL',
      'ROLLBACK',
    ]);
  });
});

test('ativa primeiro acesso sob lock com guardas de estado e empresa', async (t) => {
  for (const companyStatus of ['ATIVO', 'INATIVO']) {
    await t.test(companyStatus, async (sub) => {
      const { tx, events } = mockTransaction(sub, { companyStatus });
      const result = await authPostgresRepository.activateUser(
        targetId,
        'hash-de-senha',
        'token-atual',
      );
      assert.equal(result, companyStatus === 'ATIVO');
      assert.deepEqual(events, ['BEGIN', 'LOCK', 'UPDATE_MANY', 'COMMIT']);
      assert.deepEqual(tx.users.updateMany.mock.calls[0].arguments[0], {
        where: {
          id: targetId,
          invite_token: 'token-atual',
          status: 'PENDING',
          deleted_at: null,
          OR: [
            { role: 'SUPER_ADMIN', company_id: null },
            {
              role: { in: ['ADMIN_EMPRESA', 'ATENDENTE'] },
              companies: { is: { status: { not: 'INATIVO' }, deleted_at: null } },
            },
          ],
        },
        data: { password_hash: 'hash-de-senha', status: 'ACTIVE', invite_token: null },
      });
    });
  }
});

test('agrupa métricas por perfil e estado e devolve perfis em minúsculas', async (t) => {
  const group = mockPrismaMethod(
    t,
    prisma.users,
    'groupBy',
    async (_args: Prisma.usersGroupByArgs) => [
      { role: 'SUPER_ADMIN', status: 'ACTIVE', _count: { _all: 2 } },
      { role: 'ADMIN_EMPRESA', status: 'ACTIVE', _count: { _all: 4 } },
      { role: 'ADMIN_EMPRESA', status: 'PENDING', _count: { _all: 1 } },
      { role: 'ATENDENTE', status: 'BLOCKED', _count: { _all: 1 } },
    ],
  );
  const metrics = await userPostgresRepository.getManagedUsersMetrics();
  assert.deepEqual(group.mock.calls[0].arguments[0], {
    by: ['role', 'status'],
    where: {
      deleted_at: null,
      role: { in: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'ATENDENTE'] },
    },
    _count: { _all: true },
  });
  assert.deepEqual(metrics, {
    total: 8,
    active: 6,
    pending: 1,
    blocked: 1,
    byRole: [
      { role: 'super_admin', total: 2, active: 2, pending: 0, blocked: 0 },
      { role: 'admin_empresa', total: 5, active: 4, pending: 1, blocked: 0 },
      { role: 'atendente', total: 1, active: 0, pending: 0, blocked: 1 },
    ],
  });
});

test('mapeia violações de unicidade do Prisma e do SQL parametrizado para conflito', async (t) => {
  await t.test('P2002 na alteração administrativa', async (sub) => {
    const { tx, events } = mockTransaction(sub);
    tx.users.update.mock.mockImplementation(async () => {
      throw Object.assign(new Error('E-mail duplicado'), { code: 'P2002' });
    });
    await assert.rejects(userPostgresRepository.changeUserAdministration(change()), {
      status: 409,
      message: 'E-mail já cadastrado.',
    });
    assert.equal(events.at(-1), 'ROLLBACK');
  });

  await t.test('23505 na alteração do próprio perfil', async (sub) => {
    const raw = mockPrismaMethod(
      sub,
      prisma,
      '$queryRaw',
      async (_query: TemplateStringsArray, ..._values: unknown[]) => {
        throw Object.assign(new Error('E-mail duplicado'), {
          code: 'P2010',
          meta: { code: '23505' },
        });
      },
    );
    await assert.rejects(
      userPostgresRepository.updateOwnProfile(targetId, {
        name: 'Nome atualizado',
        email: 'usado@example.test',
      }),
      { status: 409, message: 'E-mail já cadastrado.' },
    );
    const [query, ...values] = raw.mock.calls[0].arguments;
    assert.match(query.join('?'), /tokens_revoked_at = CASE WHEN LOWER\(email\)/);
    assert.match(query.join('?'), /deleted_at IS NULL AND status = 'ACTIVE'/);
    assert.equal(values.at(-1), targetId);
  });
});
