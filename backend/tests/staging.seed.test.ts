import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyStagingSeed,
  decimalPrice,
  prepareStagingSeed,
  type SeedConnection,
} from '../scripts/lib/staging.seed.js';
import {
  applyDatabaseReset,
  RESET_TARGET_TABLES,
  type ResetConnection,
} from '../scripts/lib/database.reset.js';

const companyId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const hash = '$2b$10$' + 'A'.repeat(53);
const databasePlanId = '9007199254740993123';

function fixture() {
  return {
    version: 1 as const,
    companies: [
      {
        id: companyId,
        nome: 'Empresa de teste',
        cnpj: '12345678000190',
        descricao: 'Descrição sintética',
        descricao_detalhada: 'Detalhes sintéticos',
        categoria: 'Serviços',
        cidade: 'Cidade teste',
        estado: 'CE',
        status: 'ativo',
        verificado: false,
        tamanho: 'pequena',
        email: 'empresa@example.test',
      },
    ],
    users: [
      {
        id: userId,
        email: 'admin@example.test',
        name: 'Usuário teste',
        role: 'admin_empresa',
        password_hash: hash,
        status: 'active',
        company_id: companyId,
        plan_id: 'local-plan',
        invite_token: 'token-local-descartado',
        reset_password_token: 'reset-local-descartado',
        reset_password_expires: '2030-01-01T00:00:00.000Z',
      },
    ],
    plans: [
      {
        id: 'local-plan',
        name: 'Plano teste',
        slug: 'plano-teste',
        description: 'Plano sintético',
        price: '29.90',
        billing_period: 'monthly',
        features: ['Recurso teste'],
        limits: { users: 3, storage: 'small' },
        is_featured: false,
        is_active: true,
        display_order: 1,
      },
    ],
    images: [] as unknown[],
    outbox: [],
  };
}

function fakeConnection(
  options: {
    missingColumn?: boolean;
    occupied?: 'companies' | 'users';
    existingPlan?: Record<string, unknown>;
    failAt?: string;
    rollbackFails?: boolean;
  } = {},
) {
  const calls: { text: string; values?: unknown[] }[] = [];
  const failure = new Error('Falha simulada de persistência');
  const connection: SeedConnection = {
    async query(text, values) {
      calls.push({ text, values });
      if (options.failAt && text.includes(options.failAt)) {
        throw failure;
      }
      if (text === 'ROLLBACK' && options.rollbackFails) {
        throw new Error('Falha simulada de rollback');
      }
      if (text.includes('information_schema.columns')) {
        return { rows: options.missingColumn ? [] : [{ column_name: 'company_id' }] };
      }
      if (text.startsWith('SELECT EXISTS')) {
        return {
          rows: [
            {
              companies: options.occupied === 'companies',
              users: options.occupied === 'users',
            },
          ],
        };
      }
      if (text.startsWith('SELECT * FROM plans')) {
        return { rows: options.existingPlan ? [options.existingPlan] : [] };
      }
      if (text.startsWith('INSERT INTO plans')) {
        return { rows: [{ id: databasePlanId }] };
      }
      return { rows: [] };
    },
  };
  return { connection, calls, failure };
}

test('preço preserva precisão decimal sem conversão do identificador para Number', () => {
  assert.equal(decimalPrice('00029.9'), '29.90');
  assert.equal(decimalPrice('9999999999.99'), '9999999999.99');
  assert.equal(decimalPrice(0), '0.00');
  for (const value of ['1.001', '10000000000', '-1', '1e3', 'NaN']) {
    assert.throws(() => decimalPrice(value));
  }
});

test('importa em transação, mapeia plano local para BIGINT e preserva hash/vínculo sem tokens', async () => {
  const { connection, calls } = fakeConnection();
  await applyStagingSeed(connection, prepareStagingSeed(fixture()));
  assert.equal(calls[0].text, 'BEGIN');
  assert.equal(calls[1].text, 'SET LOCAL search_path TO public');
  const lock = calls.findIndex((call) => call.text.startsWith('LOCK TABLE'));
  assert.ok(lock > 1);
  assert.ok(lock < calls.findIndex((call) => call.text.startsWith('SELECT EXISTS')));
  assert.equal(calls.at(-1)?.text, 'COMMIT');
  const company = calls.find((call) => call.text.startsWith('INSERT INTO companies'))!;
  const user = calls.find((call) => call.text.startsWith('INSERT INTO users'))!;
  assert.equal(company.values?.[0], companyId);
  assert.match(company.text, /INSERT INTO companies \(id, name, cnpj,/);
  assert.match(company.text, /\$9::company_status,\$10,\$11,\$12::numrange/);
  assert.equal(company.values?.[8], 'ATIVO');
  assert.deepEqual(user.values, [
    userId,
    'Usuário teste',
    'admin@example.test',
    'admin_empresa',
    hash,
    'ACTIVE',
    companyId,
    databasePlanId,
  ]);
  assert.match(user.text, /\$6::user_status/);
  assert.match(user.text, /NULL,NULL,NULL,NOW\(\),NOW\(\)/);
  assert.ok(!JSON.stringify(calls).includes('token-local-descartado'));
  assert.ok(!calls.some((call) => /INSERT INTO (images|outbox)/.test(call.text)));
});

const invalidCases: [string, (data: ReturnType<typeof fixture>) => void][] = [
  [
    'UUID empresa',
    (data) => {
      data.companies[0].id = 'invalid';
    },
  ],
  [
    'UUID usuário',
    (data) => {
      data.users[0].id = 'invalid';
    },
  ],
  [
    'plano ausente',
    (data) => {
      data.users[0].plan_id = 'unknown';
    },
  ],
  [
    'empresa ausente',
    (data) => {
      data.users[0].company_id = '33333333-3333-4333-8333-333333333333';
    },
  ],
  [
    'empresa duplicada',
    (data) => {
      data.companies.push({ ...data.companies[0] });
    },
  ],
  [
    'CNPJ duplicado',
    (data) => {
      data.companies.push({
        ...data.companies[0],
        id: '33333333-3333-4333-8333-333333333333',
        email: 'outra@example.test',
      });
    },
  ],
  [
    'e-mail empresarial sem distinção de caixa',
    (data) => {
      data.companies.push({
        ...data.companies[0],
        id: '33333333-3333-4333-8333-333333333333',
        cnpj: '98765432000190',
        email: 'EMPRESA@example.test',
      });
    },
  ],
  [
    'e-mail de usuário sem distinção de caixa',
    (data) => {
      data.users.push({
        ...data.users[0],
        id: '33333333-3333-4333-8333-333333333333',
        email: 'ADMIN@example.test',
      });
    },
  ],
  [
    'usuário duplicado',
    (data) => {
      data.users.push({ ...data.users[0] });
    },
  ],
  [
    'plano duplicado',
    (data) => {
      data.plans.push({ ...data.plans[0] });
    },
  ],
  [
    'slug duplicado',
    (data) => {
      data.plans.push({ ...data.plans[0], id: 'other' });
    },
  ],
  [
    'fração maior que duas casas',
    (data) => {
      data.plans[0].price = '1.234';
    },
  ],
  [
    'preço excessivo',
    (data) => {
      data.plans[0].price = '10000000000';
    },
  ],
  [
    'admin sem empresa',
    (data) => {
      Object.assign(data.users[0], { company_id: null });
    },
  ],
  [
    'atendente sem empresa',
    (data) => {
      Object.assign(data.users[0], { role: 'atendente', company_id: null });
    },
  ],
  [
    'superadmin com empresa',
    (data) => {
      data.users[0].role = 'super_admin';
    },
  ],
  [
    'cliente com empresa',
    (data) => {
      data.users[0].role = 'cliente';
    },
  ],
  [
    'convite pendente',
    (data) => {
      data.users[0].status = 'pending';
    },
  ],
  [
    'hash ausente',
    (data) => {
      data.users[0].password_hash = '';
    },
  ],
  [
    'capa existente',
    (data) => {
      Object.assign(data.companies[0], { cover_key: 'companies/cover.png' });
    },
  ],
  [
    'logo existente',
    (data) => {
      Object.assign(data.companies[0], { logo_key: 'companies/logo.png' });
    },
  ],
  [
    'imagem existente',
    (data) => {
      data.images.push({
        id: userId,
        object_key: 'cover.png',
        original_name: 'cover.png',
        mime_type: 'image/png',
        size_bytes: 1,
        module: 'companies',
        resource_id: companyId,
        purpose: 'cover',
        uploaded_by: userId,
        created_at: '2030-01-01T00:00:00.000Z',
      });
    },
  ],
];
for (const [name, mutate] of invalidCases) {
  test(`rejeita ${name} antes de acessar banco`, async () => {
    const data = fixture();
    mutate(data);
    const { connection, calls } = fakeConnection();
    await assert.rejects(applyStagingSeed(connection, data as never));
    assert.equal(calls.length, 0);
  });
}

test('aceita os quatro papéis somente com escopo empresarial válido', () => {
  for (const role of ['admin_empresa', 'atendente', 'super_admin', 'cliente']) {
    const data = fixture();
    Object.assign(data.users[0], {
      role,
      company_id: ['super_admin', 'cliente'].includes(role) ? null : companyId,
    });
    assert.equal(prepareStagingSeed(data).users[0].role, role);
  }
});

for (const occupied of ['companies', 'users'] as const) {
  test(`não sobrescreve destino com ${occupied}`, async () => {
    const { connection, calls } = fakeConnection({ occupied });
    await assert.rejects(
      applyStagingSeed(connection, prepareStagingSeed(fixture())),
      /sobrescrever/,
    );
    assert.equal(calls.at(-1)?.text, 'ROLLBACK');
    assert.ok(!calls.some((call) => /^(INSERT|UPDATE|DELETE)/.test(call.text)));
  });
}

test('exige coluna de vínculo antes de inserir ou bloquear tabelas', async () => {
  const { connection, calls } = fakeConnection({ missingColumn: true });
  await assert.rejects(
    applyStagingSeed(connection, prepareStagingSeed(fixture())),
    /company_id ausente/,
  );
  assert.equal(calls.at(-1)?.text, 'ROLLBACK');
  assert.ok(!calls.some((call) => /^(INSERT|LOCK)/.test(call.text)));
});

test('reutiliza plano equivalente com decimal normalizado e ordem de chaves JSON diferente', async () => {
  const data = fixture();
  const existingPlan = {
    ...data.plans[0],
    id: databasePlanId,
    price: '29.9',
    limits: { storage: 'small', users: 3 },
  };
  const { connection, calls } = fakeConnection({ existingPlan });
  await applyStagingSeed(connection, prepareStagingSeed(data));
  assert.ok(!calls.some((call) => call.text.startsWith('INSERT INTO plans')));
  assert.equal(
    calls.find((call) => call.text.startsWith('INSERT INTO users'))?.values?.[7],
    databasePlanId,
  );
  assert.equal(calls.at(-1)?.text, 'COMMIT');
});

test('plano divergente interrompe sem sobrescrever', async () => {
  const data = fixture();
  const { connection, calls } = fakeConnection({
    existingPlan: { ...data.plans[0], id: databasePlanId, price: '30.00' },
  });
  await assert.rejects(
    applyStagingSeed(connection, prepareStagingSeed(data)),
    /diverge/,
  );
  assert.equal(calls.at(-1)?.text, 'ROLLBACK');
  assert.ok(!calls.some((call) => /^(INSERT|UPDATE|DELETE)/.test(call.text)));
});

for (const [field, value] of Object.entries({
  name: 'Outro nome',
  slug: 'outro-slug',
  description: 'Outra descrição',
  billing_period: 'yearly',
  features: ['Outro recurso'],
  limits: { users: 4, storage: 'small' },
  is_featured: true,
  is_active: false,
  display_order: 2,
})) {
  test(`reutilização exige igualdade do campo ${field}`, async () => {
    const data = fixture();
    const { connection, calls } = fakeConnection({
      existingPlan: { ...data.plans[0], id: databasePlanId, [field]: value },
    });
    await assert.rejects(
      applyStagingSeed(connection, prepareStagingSeed(data)),
      /diverge/,
    );
    assert.equal(calls.at(-1)?.text, 'ROLLBACK');
    assert.ok(!calls.some((call) => /^(INSERT|UPDATE|DELETE)/.test(call.text)));
  });
}

test('falha intermediária executa rollback e preserva erro original mesmo se rollback falhar', async () => {
  const { connection, calls, failure } = fakeConnection({
    failAt: 'INSERT INTO users',
    rollbackFails: true,
  });
  await assert.rejects(
    applyStagingSeed(connection, prepareStagingSeed(fixture())),
    (error) => error === failure,
  );
  assert.equal(calls.at(-1)?.text, 'ROLLBACK');
  assert.ok(!calls.some((call) => call.text === 'COMMIT'));
});

test('reset limpa tabelas de negócio em transação preservando _prisma_migrations', async () => {
  const calls: { text: string; values?: unknown[] }[] = [];
  const connection: ResetConnection = {
    async query(text, values) {
      calls.push({ text, values });
      if (text.includes('information_schema.tables')) {
        return {
          rows: RESET_TARGET_TABLES.map((table_name) => ({ table_name })),
        };
      }
      return { rows: [] };
    },
  };

  await applyDatabaseReset(connection);

  assert.equal(calls[0].text, 'BEGIN');
  assert.equal(calls[1].text, 'SET LOCAL search_path TO public');
  assert.ok(
    calls.some(
      (call) =>
        call.text ===
        'TRUNCATE TABLE sales, company_registration_operations, images, users, companies, plans RESTART IDENTITY CASCADE',
    ),
  );
  assert.equal(calls.at(-1)?.text, 'COMMIT');
});

test('reset interrompe com rollback caso alguma tabela das migrations esteja ausente', async () => {
  const calls: { text: string; values?: unknown[] }[] = [];
  const connection: ResetConnection = {
    async query(text, values) {
      calls.push({ text, values });
      if (text.includes('information_schema.tables')) {
        return {
          rows: [{ table_name: 'plans' }],
        };
      }
      return { rows: [] };
    },
  };

  await assert.rejects(applyDatabaseReset(connection), /Tabelas ausentes no banco/);
  assert.equal(calls.at(-1)?.text, 'ROLLBACK');
  assert.ok(!calls.some((call) => call.text.startsWith('TRUNCATE TABLE')));
});
