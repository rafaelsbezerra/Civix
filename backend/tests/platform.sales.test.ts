import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import bcrypt from 'bcrypt';

const temporaryRoot = await mkdtemp(join(tmpdir(), 'civix-platform-sales-'));
const dataFile = join(temporaryRoot, 'data.json');
const superAdminId = randomUUID();
const adminId = randomUUID();
const attendantId = randomUUID();
const companyId = randomUUID();
const secondCompanyId = randomUUID();
const inactiveCompanyId = randomUUID();
const archivedCompanyId = randomUUID();
const planId = '1';
const passwordHash = await bcrypt.hash('senha-sintetica-sales', 4);

Object.assign(process.env, {
  USE_MOCK_DATA: 'true',
  MOCK_DATA_DIR: temporaryRoot,
  JWT_SECRET: 'segredo-sintetico-platform-sales',
  LOG_LEVEL: 'fatal',
});

function makeCompany(
  id: string,
  name: string,
  options: {
    status?: 'ativo' | 'inativo';
    deletedAt?: string | null;
    planId?: string;
  } = {},
) {
  return {
    id,
    nome: name,
    cnpj: id,
    descricao: 'Resumo sintético',
    descricao_detalhada: 'Descrição sintética de teste.',
    categoria: 'Serviços',
    cidade: 'Fortaleza',
    estado: 'CE',
    status: options.status ?? 'ativo',
    verificado: false,
    tamanho: 'pequena',
    email: null,
    plan_id: options.planId ?? planId,
    cover_key: null,
    logo_key: null,
    deleted_at: options.deletedAt ?? null,
    deactivation_reason: null,
    deactivated_at: null,
    deactivated_by: null,
  };
}

function fixture() {
  return {
    version: 1,
    companies: [
      makeCompany(companyId, 'Empresa Vendas'),
      makeCompany(secondCompanyId, 'Empresa Secundária', { planId: '2' }),
      makeCompany(inactiveCompanyId, 'Empresa Inativa', { status: 'inativo' }),
      makeCompany(archivedCompanyId, 'Empresa Arquivada', {
        status: 'inativo',
        deletedAt: '2026-11-01T12:00:00.000Z',
      }),
    ],
    users: [
      {
        id: superAdminId,
        email: 'super-admin@example.test',
        role: 'super_admin',
        name: 'Superadmin sintético',
        password_hash: passwordHash,
        status: 'active',
        deleted_at: null,
        deactivation_reason: null,
        tokens_revoked_at: null,
        company_id: null,
      },
      {
        id: adminId,
        email: 'admin@example.test',
        role: 'admin_empresa',
        name: 'Admin sintético',
        password_hash: passwordHash,
        status: 'active',
        deleted_at: null,
        deactivation_reason: null,
        tokens_revoked_at: null,
        company_id: companyId,
      },
      {
        id: attendantId,
        email: 'atendente@example.test',
        role: 'atendente',
        name: 'Atendente sintético',
        password_hash: passwordHash,
        status: 'active',
        deleted_at: null,
        deactivation_reason: null,
        tokens_revoked_at: null,
        company_id: companyId,
      },
    ],
    images: [],
    plans: [
      {
        id: '1',
        name: 'Plano vigente',
        slug: 'plano-vigente',
        description: 'Plano de teste',
        price: '39.90',
        billing_period: 'monthly',
        features: [],
        limits: {},
        is_featured: false,
        is_active: true,
        display_order: 1,
      },
      {
        id: '2',
        name: 'Plano secundário',
        slug: 'plano-secundario',
        description: 'Plano de teste',
        price: '59.00',
        billing_period: 'yearly',
        features: [],
        limits: {},
        is_featured: false,
        is_active: true,
        display_order: 2,
      },
      {
        id: '3',
        name: 'Plano inativo',
        slug: 'plano-inativo',
        description: 'Plano de teste',
        price: '19.90',
        billing_period: 'monthly',
        features: [],
        limits: {},
        is_featured: false,
        is_active: false,
        display_order: 3,
      },
      {
        id: '4',
        name: 'Plano sem preço',
        slug: 'plano-sem-preco',
        description: 'Plano de teste',
        price: '0.00',
        billing_period: 'monthly',
        features: [],
        limits: {},
        is_featured: false,
        is_active: true,
        display_order: 4,
      },
    ],
    sales: [],
    companyRegistrationOperations: [],
    outbox: [],
  };
}

test('vendas administrativas em HTTP com persistência JSON sintética', async (t) => {
  const { app } = await import('../src/app.js');
  const { signToken } = await import('../src/services/auth.service.js');
  const { readLocalData } = await import('../src/persistence/json/local.store.js');
  const server = app.listen(0, '127.0.0.1');
  const credentials = {
    super: {
      id: superAdminId,
      email: 'super-admin@example.test',
      role: 'super_admin',
      companyId: null,
    },
    admin: {
      id: adminId,
      email: 'admin@example.test',
      role: 'admin_empresa',
      companyId,
    },
    attendant: {
      id: attendantId,
      email: 'atendente@example.test',
      role: 'atendente',
      companyId,
    },
  } as const;

  function token(user: keyof typeof credentials) {
    return signToken(
      { ...credentials[user], tokenVersion: 2, issuedAt: new Date().toISOString() },
      '1h',
    );
  }

  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    async function reset() {
      await writeFile(dataFile, JSON.stringify(fixture()), 'utf8');
    }

    async function request(
      path: string,
      options: { method?: string; body?: unknown; accessToken?: string | null } = {},
    ) {
      const headers: Record<string, string> = {};
      if (options.accessToken !== null) {
        headers.Authorization = `Bearer ${options.accessToken ?? token('super')}`;
      }
      if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
      }
      const response = await fetch(baseUrl + path, {
        method: options.method ?? 'GET',
        headers,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      });
      const responseText = await response.text();
      return {
        status: response.status,
        body: responseText ? (JSON.parse(responseText) as any) : undefined,
      };
    }

    function saleInput(overrides: Record<string, unknown> = {}) {
      return {
        companyId,
        operationId: randomUUID(),
        pricingMode: 'manual_amount',
        amount: '125.50',
        description: 'Serviço extraordinário',
        soldAt: '2026-11-01T12:00:00.000Z',
        ...overrides,
      };
    }

    await t.test(
      'somente superadmin acessa, campos internos são recusados e não há edição',
      async () => {
        await reset();
        const input = saleInput();
        assert.equal(
          (
            await request('/api/v1/platform/sales', {
              method: 'POST',
              body: input,
              accessToken: null,
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await request('/api/v1/platform/sales', {
              method: 'POST',
              body: input,
              accessToken: token('admin'),
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await request('/api/v1/platform/sales', {
              method: 'POST',
              body: input,
              accessToken: token('attendant'),
            })
          ).status,
          403,
        );

        assert.equal(
          (
            await request('/api/v1/platform/sales', {
              method: 'POST',
              body: { ...input, id: randomUUID() },
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request('/api/v1/platform/sales', {
              method: 'POST',
              body: saleInput({ pricingMode: 'company_plan', amount: '125.50' }),
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request('/api/v1/platform/sales', {
              method: 'POST',
              body: saleInput({ pricingMode: 'company_plan', planId: '4' }),
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request('/api/v1/platform/sales', {
              method: 'POST',
              body: saleInput({ amount: 125.5 }),
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request('/api/v1/platform/sales', {
              method: 'POST',
              body: saleInput({ description: '   ' }),
            })
          ).status,
          400,
        );

        const created = await request('/api/v1/platform/sales', {
          method: 'POST',
          body: input,
        });
        assert.equal(created.status, 201);
        const saleId = created.body.data.sale.id as string;
        assert.equal(
          (
            await request(`/api/v1/platform/sales/${saleId}`, {
              method: 'PUT',
              body: { description: 'Edição' },
            })
          ).status,
          404,
        );
        assert.equal(
          (
            await request(`/api/v1/platform/sales/${saleId}`, {
              method: 'PATCH',
              body: { description: 'Edição' },
            })
          ).status,
          404,
        );
      },
    );

    await t.test(
      'venda manual é idempotente, conflito compara dados e exclusão libera a operação',
      async () => {
        await reset();
        const input = saleInput();
        const first = await request('/api/v1/platform/sales', {
          method: 'POST',
          body: input,
        });
        const replay = await request('/api/v1/platform/sales', {
          method: 'POST',
          body: input,
        });
        assert.equal(first.status, 201);
        assert.equal(first.body.data.replayed, false);
        assert.equal(replay.status, 201);
        assert.equal(replay.body.data.replayed, true);
        assert.equal(replay.body.data.sale.id, first.body.data.sale.id);
        assert.equal('operationId' in first.body.data.sale, false);
        assert.equal('fingerprint' in first.body.data.sale, false);

        const conflict = await request('/api/v1/platform/sales', {
          method: 'POST',
          body: { ...input, description: 'Dados divergentes' },
        });
        assert.equal(conflict.status, 409);

        const saleId = first.body.data.sale.id as string;
        assert.equal(
          (await request(`/api/v1/platform/sales/${saleId}`, { method: 'DELETE' }))
            .status,
          204,
        );
        assert.equal((await request(`/api/v1/platform/sales/${saleId}`)).status, 404);
        const recreated = await request('/api/v1/platform/sales', {
          method: 'POST',
          body: input,
        });
        assert.equal(recreated.status, 201);
        assert.equal(recreated.body.data.replayed, false);
        assert.notEqual(recreated.body.data.sale.id, saleId);
        assert.equal((await readLocalData()).sales.length, 1);
      },
    );

    await t.test(
      'venda por plano mantém snapshot do preço histórico e venda manual não vincula plano',
      async () => {
        await reset();
        const input = saleInput({
          pricingMode: 'company_plan',
          description: 'Cobrança negociada com plano',
          amount: undefined,
          planId: undefined,
        });
        delete (input as Record<string, unknown>).amount;
        delete (input as Record<string, unknown>).planId;
        const created = await request('/api/v1/platform/sales', {
          method: 'POST',
          body: input,
        });
        assert.equal(created.status, 201);
        const saleId = created.body.data.sale.id as string;
        assert.equal(created.body.data.sale.planId, planId);
        assert.equal(created.body.data.sale.planName, 'Plano vigente');
        assert.equal(created.body.data.sale.planPrice, '39.90');
        assert.equal(created.body.data.sale.amount, '39.90');

        const data = JSON.parse(await readFile(dataFile, 'utf8')) as ReturnType<
          typeof fixture
        >;
        data.plans[0].price = '99.00';
        data.plans[0].name = 'Plano reajustado';
        await writeFile(dataFile, JSON.stringify(data), 'utf8');
        const historical = await request(`/api/v1/platform/sales/${saleId}`);
        assert.equal(historical.status, 200);
        assert.equal(historical.body.data.amount, '39.90');
        assert.equal(historical.body.data.planPrice, '39.90');
        assert.equal(historical.body.data.planName, 'Plano vigente');

        const manual = await request('/api/v1/platform/sales', {
          method: 'POST',
          body: saleInput(),
        });
        assert.equal(manual.status, 201);
        assert.equal(manual.body.data.sale.planId, null);
        assert.equal(manual.body.data.sale.planPrice, null);
        assert.equal(manual.body.data.sale.planName, null);
      },
    );

    await t.test(
      'criações concorrentes da mesma operação produzem uma venda e replays',
      async () => {
        await reset();
        const input = saleInput({ operationId: randomUUID() });
        const results = await Promise.all(
          Array.from({ length: 8 }, () =>
            request('/api/v1/platform/sales', { method: 'POST', body: input }),
          ),
        );
        assert.ok(results.every((result) => result.status === 201));
        assert.equal(
          results.filter((result) => result.body.data.replayed === false).length,
          1,
        );
        assert.equal(
          new Set(results.map((result) => result.body.data.sale.id)).size,
          1,
        );
        assert.equal((await readLocalData()).sales.length, 1);
      },
    );

    await t.test(
      'filtra e pagina vendas com metadados e nomes de empresa',
      async () => {
        await reset();
        const dates = [
          '2026-11-01T12:00:00.000Z',
          '2026-10-15T12:00:00.000Z',
          '2026-09-01T12:00:00.000Z',
        ];
        for (let index = 0; index < dates.length; index += 1) {
          const input = saleInput({
            operationId: randomUUID(),
            soldAt: dates[index],
            description: `Venda ${index + 1}`,
          });
          const result = await request('/api/v1/platform/sales', {
            method: 'POST',
            body: input,
          });
          assert.equal(result.status, 201);
        }
        const filtered = await request(
          `/api/v1/platform/sales?companyId=${companyId}&origin=manual&from=2026-10-01T00%3A00%3A00.000Z&to=2026-11-30T23%3A59%3A59.000Z&limit=1&page=2`,
        );
        assert.equal(filtered.status, 200);
        assert.deepEqual(filtered.body.meta, {
          page: 2,
          pageSize: 1,
          total: 2,
          totalPages: 2,
        });
        assert.equal(filtered.body.data.length, 1);
        assert.equal(filtered.body.data[0].companyName, 'Empresa Vendas');
        assert.equal((await request('/api/v1/platform/sales?limit=101')).status, 400);
      },
    );

    await t.test(
      'empresa suspensa/arquivada rejeita nova venda e DELETE preserva plano da empresa',
      async () => {
        await reset();
        for (const unavailableId of [inactiveCompanyId, archivedCompanyId]) {
          const response = await request('/api/v1/platform/sales', {
            method: 'POST',
            body: saleInput({ companyId: unavailableId }),
          });
          assert.equal(response.status, 409);
        }

        const before = await readLocalData();
        const planInput = saleInput({ pricingMode: 'company_plan' });
        delete (planInput as Record<string, unknown>).amount;
        const created = await request('/api/v1/platform/sales', {
          method: 'POST',
          body: planInput,
        });
        assert.equal(created.status, 201);
        assert.equal(
          (
            await request(`/api/v1/platform/sales/${created.body.data.sale.id}`, {
              method: 'DELETE',
            })
          ).status,
          204,
        );
        const after = await readLocalData();
        assert.equal(
          after.companies.find((company) => company.id === companyId)?.plan_id,
          before.companies.find((company) => company.id === companyId)?.plan_id,
        );
        assert.equal(after.sales.length, 0);
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
