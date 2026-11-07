import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import bcrypt from 'bcrypt';

const temporaryRoot = await mkdtemp(join(tmpdir(), 'civix-platform-companies-'));
const dataFile = join(temporaryRoot, 'data.json');
const superAdminId = randomUUID();
const companyId = randomUUID();
const duplicateCompanyId = randomUUID();
const inactiveCompanyId = randomUUID();
const archivedCompanyId = randomUUID();
const imageId = randomUUID();
const adminId = randomUUID();
const attendantId = randomUUID();
const password = 'senha-sintetica-validada';
const passwordHash = await bcrypt.hash(password, 4);
const passwordResetExpires = '2026-11-03T12:00:00.000Z';

Object.assign(process.env, {
  USE_MOCK_DATA: 'true',
  MOCK_DATA_DIR: temporaryRoot,
  JWT_SECRET: 'segredo-sintetico-platform-companies',
  LOG_LEVEL: 'fatal',
});

function makeCompany(
  id: string,
  name: string,
  options: {
    status?: 'ativo' | 'inativo' | 'verificado';
    deletedAt?: string | null;
    planId?: string;
    cover?: boolean;
    email?: string | null;
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
    email: options.email ?? null,
    plan_id: options.planId ?? '1',
    cover_key: options.cover ? `companies/${id}/cover.png` : null,
    logo_key: null,
    deleted_at: options.deletedAt ?? null,
    deactivation_reason: null,
    deactivated_at: null,
    deactivated_by: null,
  };
}

function fixture() {
  const companies = [
    makeCompany(companyId, 'Empresa Lifecycle', { cover: true }),
    makeCompany(duplicateCompanyId, 'Empresa Duplicada', {
      planId: '4',
      email: 'duplicado@example.test',
    }),
    ...Array.from({ length: 21 }, (_, index) =>
      makeCompany(
        randomUUID(),
        `Empresa de página ${String(index + 1).padStart(2, '0')}`,
        { planId: index === 0 ? '4' : '1' },
      ),
    ),
    makeCompany(inactiveCompanyId, 'Empresa Suspensa', { status: 'inativo' }),
    makeCompany(archivedCompanyId, 'Empresa Arquivada', {
      status: 'inativo',
      deletedAt: '2026-11-01T12:00:00.000Z',
    }),
  ];
  const initialSaleId = randomUUID();

  return {
    version: 1,
    companies,
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
        invite_token: 'convite-admin-sintetico',
        reset_password_token: 'reset-admin-sintetico',
        reset_password_expires: passwordResetExpires,
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
        invite_token: 'convite-atendente-sintetico',
        reset_password_token: 'reset-atendente-sintetico',
        reset_password_expires: passwordResetExpires,
      },
    ],
    images: [
      {
        id: imageId,
        object_key: `companies/${companyId}/cover.png`,
        original_name: 'capa.png',
        mime_type: 'image/png',
        size_bytes: 68,
        module: 'companies',
        resource_id: companyId,
        purpose: 'cover',
        uploaded_by: superAdminId,
        created_at: '2026-11-01T12:00:00.000Z',
      },
    ],
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
        name: 'Plano inativo',
        slug: 'plano-inativo',
        description: 'Plano de teste',
        price: '19.90',
        billing_period: 'monthly',
        features: [],
        limits: {},
        is_featured: false,
        is_active: false,
        display_order: 2,
      },
      {
        id: '3',
        name: 'Plano zero',
        slug: 'plano-zero',
        description: 'Plano de teste',
        price: '0.00',
        billing_period: 'monthly',
        features: [],
        limits: {},
        is_featured: false,
        is_active: true,
        display_order: 3,
      },
      {
        id: '4',
        name: 'Plano novo',
        slug: 'plano-novo',
        description: 'Plano de teste',
        price: '49.90',
        billing_period: 'yearly',
        features: [],
        limits: {},
        is_featured: false,
        is_active: true,
        display_order: 4,
      },
    ],
    sales: [
      {
        id: initialSaleId,
        companyId,
        planId: '1',
        origin: 'company_creation',
        pricingMode: 'company_plan',
        planName: 'Plano vigente',
        planPrice: '39.90',
        planBillingPeriod: 'monthly',
        amount: '39.90',
        currency: 'BRL',
        description: null,
        soldAt: '2026-11-01T12:00:00.000Z',
        createdAt: '2026-11-01T12:00:00.000Z',
        createdBy: superAdminId,
      },
    ],
    companyRegistrationOperations: [],
    outbox: [],
  };
}

test('gestão administrativa de empresas em HTTP com persistência JSON sintética', async (t) => {
  const { app } = await import('../src/app.js');
  const { signToken } = await import('../src/services/auth.service.js');
  const { readLocalData } = await import('../src/persistence/json/local.store.js');
  const { imageObjectStore } =
    await import('../src/shared/integrations/cloudflare/storage.provider.js');
  const signedKeys: string[] = [];

  t.mock.method(
    imageObjectStore,
    'getPresignedUrl',
    async (key: string, seconds: number) => {
      assert.equal(seconds, 300);
      signedKeys.push(key);
      return `https://images.example.test/${encodeURIComponent(key)}?expires=${seconds}`;
    },
  );

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

  function token(user: keyof typeof credentials, issuedAt?: string) {
    const identity = credentials[user];
    return signToken(
      { ...identity, tokenVersion: 2, ...(issuedAt ? { issuedAt } : {}) },
      '1h',
    );
  }

  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    async function reset() {
      signedKeys.length = 0;
      await writeFile(dataFile, JSON.stringify(fixture()), 'utf8');
    }

    async function request(
      path: string,
      options: {
        method?: string;
        body?: unknown;
        accessToken?: string | null;
      } = {},
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
      const text = await response.text();
      return {
        status: response.status,
        body: text ? (JSON.parse(text) as any) : undefined,
      };
    }

    function updateInput(overrides: Record<string, unknown> = {}) {
      return {
        nome: 'Empresa Lifecycle Atualizada',
        cnpj: companyId,
        descricao: 'Resumo sintético atualizado',
        descricao_detalhada: 'Descrição sintética atualizada.',
        categoria: 'Serviços',
        cidade: 'Fortaleza',
        estado: 'CE',
        tamanho: 'pequena',
        email: 'lifecycle@example.test',
        planId: '4',
        ...overrides,
      };
    }

    await t.test(
      'autoriza só superadmin e lista com filtros, limite e metadados estáveis',
      async () => {
        await reset();
        assert.equal(
          (await request('/api/v1/platform/companies', { accessToken: null })).status,
          401,
        );
        assert.equal(
          (await request('/api/v1/platform/companies', { accessToken: token('admin') }))
            .status,
          403,
        );
        assert.equal(
          (
            await request('/api/v1/platform/companies', {
              accessToken: token('attendant'),
            })
          ).status,
          403,
        );

        const defaultPage = await request('/api/v1/platform/companies');
        assert.equal(defaultPage.status, 200);
        assert.equal(defaultPage.body.meta.page, 1);
        assert.equal(defaultPage.body.meta.pageSize, 20);
        assert.equal(defaultPage.body.meta.total, 25);
        assert.equal(defaultPage.body.meta.totalPages, 2);
        assert.equal(defaultPage.body.data.length, 20);
        assert.equal(
          defaultPage.body.data.some(
            (company: { cover_key?: string }) => 'cover_key' in company,
          ),
          false,
        );

        const secondPage = await request('/api/v1/platform/companies?page=2&limit=10');
        assert.equal(secondPage.status, 200);
        assert.deepEqual(secondPage.body.meta, {
          page: 2,
          pageSize: 10,
          total: 25,
          totalPages: 3,
        });
        assert.equal(secondPage.body.data.length, 10);

        const largePage = await request('/api/v1/platform/companies?limit=100');
        assert.equal(largePage.status, 200);
        assert.deepEqual(largePage.body.meta, {
          page: 1,
          pageSize: 100,
          total: 25,
          totalPages: 1,
        });
        assert.equal(largePage.body.data.length, 25);
        assert.equal(
          (await request('/api/v1/platform/companies?limit=101')).status,
          400,
        );
        assert.equal((await request('/api/v1/platform/companies?page=0')).status, 400);

        const active = await request(
          '/api/v1/platform/companies?status=ativo&limit=100',
        );
        assert.equal(active.status, 200);
        assert.equal(active.body.meta.total, 23);
        assert.ok(
          active.body.data.some((company: { id: string }) => company.id === companyId),
        );
        const unavailableCompanyIds: string[] = [inactiveCompanyId, archivedCompanyId];
        assert.ok(
          !active.body.data.some((company: { id: string }) =>
            unavailableCompanyIds.includes(company.id),
          ),
        );

        const inactive = await request(
          '/api/v1/platform/companies?status=inativo&limit=100',
        );
        assert.deepEqual(
          inactive.body.data.map((company: { id: string }) => company.id),
          [inactiveCompanyId],
        );
        const archived = await request(
          '/api/v1/platform/companies?status=archived&limit=100',
        );
        assert.deepEqual(
          archived.body.data.map((company: { id: string }) => company.id),
          [archivedCompanyId],
        );
        const byPlan = await request('/api/v1/platform/companies?planId=4&limit=100');
        assert.equal(byPlan.body.meta.total, 2);
        const byTerm = await request(
          '/api/v1/platform/companies?q=Lifecycle&limit=100',
        );
        assert.deepEqual(
          byTerm.body.data.map((company: { id: string }) => company.id),
          [companyId],
        );
      },
    );

    await t.test(
      'edita dados/plano sem venda automática e recusa plano inativo, zero ou duplicidade',
      async () => {
        await reset();
        const before = await readLocalData();
        const path = `/api/v1/platform/companies/${companyId}`;

        assert.equal(
          (await request(path, { method: 'PUT', body: updateInput({ planId: '2' }) }))
            .status,
          400,
        );
        assert.equal(
          (await request(path, { method: 'PUT', body: updateInput({ planId: '3' }) }))
            .status,
          400,
        );
        assert.equal(
          (
            await request(path, {
              method: 'PUT',
              body: updateInput({ cnpj: duplicateCompanyId }),
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request(path, {
              method: 'PUT',
              body: updateInput({ email: 'duplicado@example.test' }),
            })
          ).status,
          409,
        );

        const valid = await request(path, { method: 'PUT', body: updateInput() });
        assert.equal(valid.status, 200);
        assert.equal(valid.body.data.nome, 'Empresa Lifecycle Atualizada');
        assert.equal(valid.body.data.plan_id, '4');
        const after = await readLocalData();
        assert.deepEqual(after.sales, before.sales);
        assert.equal(
          (
            await request('/api/v1/platform/plans/4/activation', {
              method: 'POST',
              body: { active: false },
            })
          ).status,
          200,
        );
        const sameInactivePlan = await request(path, {
          method: 'PUT',
          body: updateInput({ nome: 'Dados editados com plano atual inativo' }),
        });
        assert.equal(sameInactivePlan.status, 200);
        assert.equal(sameInactivePlan.body.data.plan_id, '4');
        assert.deepEqual((await readLocalData()).sales, before.sales);
      },
    );

    await t.test(
      'motivo obrigatório, revogação da empresa e novo login após reativar',
      async () => {
        await reset();
        const profilePath = '/api/v1/users/profile';
        const legacyToken = token('admin');
        const earlierToken = token(
          'admin',
          new Date(Date.now() - 60_000).toISOString(),
        );
        assert.equal(
          (await request(profilePath, { accessToken: legacyToken })).status,
          200,
        );
        assert.equal(
          (await request(profilePath, { accessToken: earlierToken })).status,
          200,
        );

        const suspensionPath = `/api/v1/platform/companies/${companyId}/suspension`;
        assert.equal(
          (await request(suspensionPath, { method: 'POST', body: {} })).status,
          400,
        );
        assert.equal(
          (await request(suspensionPath, { method: 'POST', body: { reason: '   ' } }))
            .status,
          400,
        );
        let before = await readLocalData();
        assert.equal(
          before.companies.find((company) => company.id === companyId)?.status,
          'ativo',
        );
        assert.equal(
          before.users.find((user) => user.id === adminId)?.tokens_revoked_at,
          null,
        );

        const suspended = await request(suspensionPath, {
          method: 'POST',
          body: { reason: 'Motivo sintético de suspensão' },
        });
        assert.equal(suspended.status, 200);
        assert.equal(suspended.body.data.status, 'inativo');
        assert.equal(
          suspended.body.data.deactivation_reason,
          'Motivo sintético de suspensão',
        );
        before = await readLocalData();
        for (const id of [adminId, attendantId]) {
          const user = before.users.find((item) => item.id === id)!;
          assert.ok(user.tokens_revoked_at);
          assert.equal(user.invite_token, null);
          assert.equal(user.reset_password_token, null);
          assert.equal(user.reset_password_expires, null);
        }
        assert.equal(
          (await request(profilePath, { accessToken: legacyToken })).status,
          401,
        );
        assert.equal(
          (await request(profilePath, { accessToken: earlierToken })).status,
          401,
        );
        const publicCompanies = await request('/api/v1/empresas', {
          accessToken: null,
        });
        assert.equal(publicCompanies.status, 200);
        assert.ok(
          !publicCompanies.body.data.some(
            (company: { id: string }) => company.id === companyId,
          ),
        );
        assert.equal(
          (
            await request(`/api/v1/storage/images/${imageId}/url`, {
              accessToken: null,
            })
          ).status,
          404,
        );

        const reactivated = await request(
          `/api/v1/platform/companies/${companyId}/reactivation`,
          { method: 'POST', body: {} },
        );
        assert.equal(reactivated.status, 200);
        assert.equal(reactivated.body.data.status, 'ativo');
        assert.equal(
          (await request(profilePath, { accessToken: legacyToken })).status,
          401,
        );
        assert.equal(
          (await request(profilePath, { accessToken: earlierToken })).status,
          401,
        );

        const login = await request('/api/v1/users/login', {
          method: 'POST',
          body: { email: 'admin@example.test', password },
          accessToken: null,
        });
        assert.equal(login.status, 200);
        assert.equal(
          (await request(profilePath, { accessToken: login.body.data.token })).status,
          200,
        );
        const current = await readLocalData();
        assert.equal(
          current.companies.find((company) => company.id === companyId)
            ?.deactivation_reason,
          'Motivo sintético de suspensão',
        );
      },
    );

    await t.test(
      'arquivamento e restauração preservam vendas/imagens e restauração mantém inatividade',
      async () => {
        await reset();
        const before = await readLocalData();
        const archive = await request(`/api/v1/platform/companies/${companyId}`, {
          method: 'DELETE',
          body: { reason: 'Motivo sintético de arquivamento' },
        });
        assert.equal(archive.status, 204);
        let current = await readLocalData();
        let company = current.companies.find((item) => item.id === companyId)!;
        assert.equal(company.status, 'inativo');
        assert.ok(company.deleted_at);
        assert.equal(company.deactivation_reason, 'Motivo sintético de arquivamento');
        assert.deepEqual(current.sales, before.sales);
        assert.deepEqual(current.images, before.images);
        assert.equal(
          (
            await request(`/api/v1/storage/images/${imageId}/url`, {
              accessToken: null,
            })
          ).status,
          404,
        );

        const restore = await request(
          `/api/v1/platform/companies/${companyId}/restoration`,
          { method: 'POST', body: {} },
        );
        assert.equal(restore.status, 200);
        assert.equal(restore.body.data.status, 'inativo');
        assert.equal(restore.body.data.deleted_at, null);
        assert.equal(
          restore.body.data.deactivation_reason,
          'Motivo sintético de arquivamento',
        );
        assert.equal(
          (await request(`/api/v1/platform/companies?status=archived&limit=100`)).body
            .meta.total,
          1,
        );
        assert.equal(
          (await request(`/api/v1/platform/companies?status=inativo&limit=100`)).body
            .meta.total,
          2,
        );
        const publicCompanies = await request('/api/v1/empresas', {
          accessToken: null,
        });
        assert.ok(
          !publicCompanies.body.data.some(
            (item: { id: string }) => item.id === companyId,
          ),
        );
        assert.equal(
          (
            await request(`/api/v1/storage/images/${imageId}/url`, {
              accessToken: null,
            })
          ).status,
          404,
        );

        current = await readLocalData();
        company = current.companies.find((item) => item.id === companyId)!;
        assert.equal(company.status, 'inativo');
        assert.equal(company.deleted_at, null);
        assert.deepEqual(current.sales, before.sales);
        assert.deepEqual(current.images, before.images);
        assert.ok(current.users.find((user) => user.id === adminId)?.tokens_revoked_at);
        assert.ok(
          current.users.find((user) => user.id === attendantId)?.tokens_revoked_at,
        );
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
