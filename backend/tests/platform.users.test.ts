import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { UserAdministrationChange } from '../src/dtos/user.auth.dto.js';

const temporaryRoot = await mkdtemp(join(tmpdir(), 'civix-platform-users-'));
const dataFile = join(temporaryRoot, 'data.json');
const superAdminAId = randomUUID();
const superAdminBId = randomUUID();
const companyAId = randomUUID();
const companyBId = randomUUID();
const inactiveCompanyId = randomUUID();
const companyAdminAId = randomUUID();
const companyAdminBId = randomUUID();
const attendantId = randomUUID();
const pendingUserId = randomUUID();
const deletedUserId = randomUUID();
const saleId = randomUUID();
const imageId = randomUUID();
const password = 'senha-sintetica-usuarios';
const passwordHash = await bcrypt.hash(password, 4);
const jwtSecret = 'segredo-sintetico-platform-users';
const inviteSecret = 'segredo-convite-sintetico-platform-users';

Object.assign(process.env, {
  USE_MOCK_DATA: 'true',
  MOCK_DATA_DIR: temporaryRoot,
  JWT_SECRET: jwtSecret,
  JWT_INVITE_SECRET: inviteSecret,
  FRONTEND_URL: 'https://front.example.test',
  LOG_LEVEL: 'fatal',
});

function makeCompany(id: string, name: string, status: 'ativo' | 'inativo' = 'ativo', deletedAt: string | null = null) {
  return {
    id,
    nome: name,
    cnpj: id,
    descricao: 'Resumo sintético',
    descricao_detalhada: 'Descrição sintética.',
    categoria: 'Serviços',
    cidade: 'Fortaleza',
    estado: 'CE',
    status,
    verificado: false,
    tamanho: 'pequena',
    email: null,
    plan_id: '1',
    cover_key: null,
    logo_key: null,
    deleted_at: deletedAt,
    deactivation_reason: null,
    deactivated_at: null,
    deactivated_by: null,
  };
}

function makeUser(
  id: string,
  email: string,
  role: 'super_admin' | 'admin_empresa' | 'atendente',
  companyId: string | null,
  options: { status?: 'active' | 'pending' | 'blocked'; passwordHash?: string | null; deletedAt?: string | null; inviteToken?: string | null } = {},
) {
  return {
    id,
    email,
    name: email.split('@')[0],
    role,
    company_id: companyId,
    status: options.status ?? 'active',
    ...(options.passwordHash === null ? {} : { password_hash: options.passwordHash ?? passwordHash }),
    deleted_at: options.deletedAt ?? null,
    deactivation_reason: null,
    tokens_revoked_at: null,
    invite_token: options.inviteToken ?? null,
    reset_password_token: null,
    reset_password_expires: null,
  };
}

function fixture() {
  return {
    version: 1,
    companies: [
      makeCompany(companyAId, 'Empresa Alpha'),
      makeCompany(companyBId, 'Empresa Beta'),
      makeCompany(inactiveCompanyId, 'Empresa Suspensa', 'inativo'),
    ],
    users: [
      makeUser(superAdminAId, 'super-a@example.test', 'super_admin', null),
      makeUser(superAdminBId, 'super-b@example.test', 'super_admin', null),
      makeUser(companyAdminAId, 'admin-alpha@example.test', 'admin_empresa', companyAId),
      makeUser(companyAdminBId, 'admin-beta@example.test', 'admin_empresa', companyBId),
      makeUser(attendantId, 'atendente-alpha@example.test', 'atendente', companyAId),
      makeUser(pendingUserId, 'pendente-alpha@example.test', 'atendente', companyAId, { status: 'pending', passwordHash: null, inviteToken: 'convite-antigo' }),
      makeUser(deletedUserId, 'deleted@example.test', 'atendente', companyAId, { status: 'blocked', deletedAt: '2026-11-01T12:00:00.000Z' }),
    ],
    images: [{ id: imageId, object_key: `companies/${companyAId}/attendant.png`, original_name: 'atendente.png',
      mime_type: 'image/png', size_bytes: 128, module: 'companies', resource_id: companyAId, purpose: 'evidence',
      uploaded_by: attendantId, created_at: '2026-11-01T12:00:00.000Z' }],
    plans: [{ id: '1', name: 'Plano sintético', slug: 'plano-sintetico', description: 'Plano', price: '39.90',
      billing_period: 'monthly', features: [], limits: {}, is_featured: false, is_active: true, display_order: 1 }],
    sales: [{ id: saleId, companyId: companyAId, planId: '1', origin: 'company_creation', pricingMode: 'company_plan',
      planName: 'Plano sintético', planPrice: '39.90', planBillingPeriod: 'monthly', amount: '39.90', currency: 'BRL',
      description: null, soldAt: '2026-11-01T12:00:00.000Z', createdAt: '2026-11-01T12:00:00.000Z', createdBy: attendantId }],
    companyRegistrationOperations: [],
    outbox: [],
  };
}

test('gestão de usuários da plataforma em HTTP com persistência JSON sintética', async t => {
  const { app } = await import('../src/app.js');
  const { signToken } = await import('../src/services/auth.service.js');
  const { readLocalData } = await import('../src/persistence/json/local.store.js');
  const { userRepository } = await import('../src/persistence/user.repository.js');
  const server = app.listen(0, '127.0.0.1');
  const identities = {
    superA: { id: superAdminAId, email: 'super-a@example.test', role: 'super_admin', companyId: null },
    superB: { id: superAdminBId, email: 'super-b@example.test', role: 'super_admin', companyId: null },
    companyA: { id: companyAdminAId, email: 'admin-alpha@example.test', role: 'admin_empresa', companyId: companyAId },
    attendant: { id: attendantId, email: 'atendente-alpha@example.test', role: 'atendente', companyId: companyAId },
  } as const;

  function token(identity: keyof typeof identities, claims: Record<string, unknown> = {}) {
    return signToken({ ...identities[identity], tokenVersion: 2, issuedAt: new Date().toISOString(), ...claims }, '1h');
  }

  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    async function reset() {
      await writeFile(dataFile, JSON.stringify(fixture()), 'utf8');
    }

    async function request(path: string, options: { method?: string; body?: unknown; accessToken?: string | null } = {}) {
      const headers: Record<string, string> = {};
      if (options.accessToken !== null) headers.Authorization = `Bearer ${options.accessToken ?? token('superA')}`;
      if (options.body !== undefined) headers['Content-Type'] = 'application/json';
      const response = await fetch(baseUrl + path, {
        method: options.method ?? 'GET',
        headers,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      });
      const responseText = await response.text();
      return { status: response.status, body: responseText ? JSON.parse(responseText) as any : undefined };
    }

    async function outboxToken(index = -1) {
      const data = await readLocalData();
      const message = data.outbox.at(index);
      assert.ok(message);
      const inviteToken = new URL(message.url).searchParams.get('token');
      assert.ok(inviteToken);
      return inviteToken;
    }

    function assertNoPrivateFields(user: Record<string, unknown>) {
      for (const field of ['password_hash', 'invite_token', 'reset_password_token', 'reset_password_expires', 'tokens_revoked_at', 'deleted_at']) {
        assert.equal(field in user, false, `campo privado exposto: ${field}`);
      }
    }

    await t.test('separa tenants, autoriza apenas superadmin e lista com filtros e paginação', async () => {
      await reset();
      const path = `/api/v1/platform/companies/${companyAId}/users`;
      assert.equal((await request(path, { accessToken: null })).status, 401);
      assert.equal((await request(path, { accessToken: token('companyA') })).status, 403);
      assert.equal((await request(path, { accessToken: token('superA', { companyId: companyAId }) })).status, 401);

      const alpha = await request(path);
      assert.equal(alpha.status, 200);
      assert.equal(alpha.body.meta.page, 1);
      assert.equal(alpha.body.meta.pageSize, 20);
      assert.equal(alpha.body.meta.total, 3);
      assert.ok(alpha.body.data.some((user: { id: string }) => user.id === companyAdminAId));
      assert.ok(alpha.body.data.some((user: { id: string }) => user.id === attendantId));
      assert.ok(!alpha.body.data.some((user: { id: string }) => user.id === companyAdminBId));
      assert.ok(!alpha.body.data.some((user: { id: string }) => user.id === deletedUserId));
      assertNoPrivateFields(alpha.body.data[0]);

      const pending = await request(path + '?status=pending&role=atendente');
      assert.deepEqual(pending.body.data.map((user: { id: string }) => user.id), [pendingUserId]);
      const term = await request(path + '?q=admin-alpha&limit=1&page=1');
      assert.equal(term.body.meta.total, 1);
      assert.equal(term.body.data[0].id, companyAdminAId);
      assert.equal((await request(path + '?limit=101')).status, 400);
      assert.equal((await request(path + '?role=super_admin')).status, 400);
      assert.equal((await request(`/api/v1/platform/administrators?role=super_admin`)).status, 400);

      const beta = await request(`/api/v1/platform/companies/${companyBId}/users`);
      assert.equal(beta.body.meta.total, 1);
      assert.equal(beta.body.data[0].id, companyAdminBId);
      assert.equal((await request(`/api/v1/platform/companies/${companyBId}/users/${companyAdminAId}`, { method: 'PUT', body: {
        name: 'Tentativa de transferência', email: 'tentativa@example.test', role: 'admin_empresa',
      } })).status, 404);

      const administrators = await request('/api/v1/platform/administrators');
      assert.equal(administrators.body.meta.total, 2);
      assert.ok(administrators.body.data.every((user: { role: string; companyId: string | null }) => user.role === 'super_admin' && user.companyId === null));
    });

    await t.test('empresa inativa mantém consulta histórica e bloqueia alteração; motivo vazio é inválido', async () => {
      await reset();
      const data = JSON.parse(await readFile(dataFile, 'utf8')) as ReturnType<typeof fixture>;
      data.companies.find(company => company.id === companyAId)!.status = 'inativo';
      await writeFile(dataFile, JSON.stringify(data), 'utf8');

      const usersPath = `/api/v1/platform/companies/${companyAId}/users`;
      const history = await request(usersPath);
      assert.equal(history.status, 200);
      assert.equal(history.body.meta.total, 3);
      assert.equal((await request(`${usersPath}/${attendantId}/suspension`, { method: 'POST', body: { reason: 'Motivo válido' } })).status, 409);
      assert.equal((await request(`${usersPath}/invitations`, { method: 'POST', body: { email: 'novo@example.test', role: 'atendente' } })).status, 409);
      assert.equal((await request(`/api/v1/platform/companies/${companyBId}/users/${companyAdminBId}/suspension`, { method: 'POST', body: { reason: '   ' } })).status, 400);
      assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/${attendantId}`, { method: 'DELETE', body: { reason: '   ' } })).status, 400);
    });

    await t.test('último admin empresarial pode ser suspenso sem bloquear histórico', async () => {
      await reset();
      const response = await request(`/api/v1/platform/companies/${companyAId}/users/${companyAdminAId}/suspension`, {
        method: 'POST', body: { reason: 'Acesso temporariamente suspenso' },
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.data.status, 'blocked');
      assert.equal(response.body.data.deactivationReason, 'Acesso temporariamente suspenso');
      const users = await request(`/api/v1/platform/companies/${companyAId}/users?status=blocked`);
      assert.ok(users.body.data.some((user: { id: string }) => user.id === companyAdminAId));
    });

    await t.test('exclusão lógica do atendente preserva referências e invalida login/sessão', async () => {
      await reset();
      const oldToken = token('attendant');
      assert.equal((await request('/api/v1/users/profile', { accessToken: oldToken })).status, 200);
      assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/${companyAdminAId}`, {
        method: 'DELETE', body: { reason: 'Não pode excluir admin' },
      })).status, 400);
      const result = await request(`/api/v1/platform/companies/${companyAId}/users/${attendantId}`, {
        method: 'DELETE', body: { reason: 'Atendente desligado' },
      });
      assert.equal(result.status, 204);

      const data = await readLocalData();
      const user = data.users.find(item => item.id === attendantId)!;
      assert.equal(user.status, 'blocked');
      assert.ok(user.deleted_at);
      assert.equal(user.deactivation_reason, 'Atendente desligado');
      assert.ok(user.tokens_revoked_at);
      assert.equal(user.company_id, companyAId);
      assert.equal(user.invite_token, null);
      assert.equal(user.reset_password_token, null);
      assert.equal(data.images.find(image => image.id === imageId)?.uploaded_by, attendantId);
      assert.equal(data.sales.find(sale => sale.id === saleId)?.createdBy, attendantId);
      assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users`)).body.meta.total, 2);
      assert.equal((await request('/api/v1/users/profile', { accessToken: oldToken })).status, 401);
      assert.equal((await request('/api/v1/users/login', { method: 'POST', accessToken: null, body: { email: 'atendente-alpha@example.test', password } })).status, 401);
    });

    await t.test('suspensão revoga tokens e reativação exige login; conta sem senha volta pendente', async () => {
      await reset();
      const oldToken = token('companyA');
      assert.equal((await request('/api/v1/users/profile', { accessToken: oldToken })).status, 200);
      const suspension = `/api/v1/platform/companies/${companyAId}/users/${companyAdminAId}/suspension`;
      assert.equal((await request(suspension, { method: 'POST', body: { reason: '  ' } })).status, 400);
      assert.equal((await request(suspension, { method: 'POST', body: { reason: 'Afastamento' } })).status, 200);
      assert.equal((await request('/api/v1/users/profile', { accessToken: oldToken })).status, 401);

      const reactivation = `/api/v1/platform/companies/${companyAId}/users/${companyAdminAId}/reactivation`;
      const active = await request(reactivation, { method: 'POST', body: {} });
      assert.equal(active.status, 200);
      assert.equal(active.body.data.status, 'active');
      assert.equal(active.body.data.invitationStatus, 'accepted');
      assertNoPrivateFields(active.body.data);
      assert.equal((await request('/api/v1/users/profile', { accessToken: oldToken })).status, 401);

      const login = await request('/api/v1/users/login', { method: 'POST', accessToken: null,
        body: { email: 'admin-alpha@example.test', password } });
      assert.equal(login.status, 200);
      assert.equal((await request('/api/v1/users/profile', { accessToken: login.body.data.token })).status, 200);

      const pendingSuspension = await request(`/api/v1/platform/companies/${companyAId}/users/${pendingUserId}/suspension`, {
        method: 'POST', body: { reason: 'Convite cancelado temporariamente' },
      });
      assert.equal(pendingSuspension.status, 200);
      const pendingReactivate = await request(`/api/v1/platform/companies/${companyAId}/users/${pendingUserId}/reactivation`, { method: 'POST', body: {} });
      assert.equal(pendingReactivate.status, 200);
      assert.equal(pendingReactivate.body.data.status, 'pending');
      assert.equal(pendingReactivate.body.data.invitationStatus, 'invalidated');
      const pending = (await readLocalData()).users.find(item => item.id === pendingUserId)!;
      assert.equal(pending.invite_token, null);
      assert.equal(pending.password_hash, undefined);
    });

    await t.test('login iniciado antes da suspensão não emite sessão utilizável mesmo se bcrypt termina depois', async sub => {
      await reset();
      let releasePasswordCheck!: () => void;
      let markPasswordCheckStarted!: () => void;
      const passwordCheckStarted = new Promise<void>(resolve => { markPasswordCheckStarted = resolve; });
      const passwordCheckGate = new Promise<void>(resolve => { releasePasswordCheck = resolve; });
      const comparePassword = bcrypt.compare.bind(bcrypt);
      sub.mock.method(bcrypt, 'compare', async (candidate: string, storedHash: string) => {
        markPasswordCheckStarted();
        await passwordCheckGate;
        return comparePassword(candidate, storedHash);
      });

      const loginPromise = request('/api/v1/users/login', { method: 'POST', accessToken: null,
        body: { email: 'admin-alpha@example.test', password } });
      try {
        await passwordCheckStarted;
        assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/${companyAdminAId}/suspension`, {
          method: 'POST', body: { reason: 'Suspensão durante autenticação' },
        })).status, 200);
        assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/${companyAdminAId}/reactivation`, {
          method: 'POST', body: {},
        })).status, 200);
      } finally {
        releasePasswordCheck();
      }
      const completedLogin = await loginPromise;
      assert.equal(completedLogin.status, 200);
      assert.equal((await request('/api/v1/users/profile', { accessToken: completedLogin.body.data.token })).status, 401);
    });

    await t.test('autossuspensão global é recusada e solicitações concorrentes deixam um superadmin ativo', async () => {
      await reset();
      const own = await request(`/api/v1/platform/administrators/${superAdminAId}/suspension`, {
        method: 'POST', body: { reason: 'Tentativa própria' },
      });
      assert.equal(own.status, 409);
      const before = await readLocalData();
      assert.equal(before.users.find(user => user.id === superAdminAId)?.status, 'active');

      const responses = await Promise.all([
        request(`/api/v1/platform/administrators/${superAdminBId}/suspension`, { method: 'POST', body: { reason: 'Desativar conta B' }, accessToken: token('superA') }),
        request(`/api/v1/platform/administrators/${superAdminAId}/suspension`, { method: 'POST', body: { reason: 'Desativar conta A' }, accessToken: token('superB') }),
      ]);
      assert.equal(responses.filter(response => response.status === 200).length, 1);
      assert.ok(responses.every(response => [200, 401, 403, 409].includes(response.status)));
      const after = await readLocalData();
      assert.equal(after.users.filter(user => user.role === 'super_admin' && user.company_id === null && !user.deleted_at && user.password_hash && user.status === 'active').length, 1);
    });

    await t.test('convite empresarial reenvia novo JTI de 24 horas e só pode ser consumido uma vez', async () => {
      await reset();
      const invite = await request(`/api/v1/platform/companies/${companyAId}/users/invitations`, {
        method: 'POST', body: { email: 'nova-pessoa@example.test', name: 'Pessoa Nova', role: 'atendente' },
      });
      assert.equal(invite.status, 201);
      assert.equal(invite.body.data.user.status, 'pending');
      assert.equal(invite.body.data.user.companyId, companyAId);
      assertNoPrivateFields(invite.body.data.user);
      assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/invitations`, {
        method: 'POST', body: { email: 'nova-pessoa@example.test', name: 'Tentativa', role: 'admin_empresa' },
      })).status, 409);
      assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/invitations`, {
        method: 'POST', body: { email: 'invalido@example.test', role: 'super_admin' },
      })).status, 400);
      assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/invitations`, {
        method: 'POST', body: { email: 'invalido@example.test', role: 'atendente', companyId: companyBId },
      })).status, 400);

      const first = await outboxToken(0);
      const firstClaims = jwt.verify(first, inviteSecret) as jwt.JwtPayload;
      assert.equal(firstClaims.exp! - firstClaims.iat!, 86400);
      const resend = await request('/api/auth/resend-invite-email', {
        method: 'POST', accessToken: null, body: { email: 'nova-pessoa@example.test' },
      });
      assert.equal(resend.status, 200);
      const second = await outboxToken(1);
      const secondClaims = jwt.verify(second, inviteSecret) as jwt.JwtPayload;
      assert.equal(secondClaims.exp! - secondClaims.iat!, 86400);
      assert.notEqual(firstClaims.jti, secondClaims.jti);
      assert.equal((await request(`/api/auth/validate-token?token=${encodeURIComponent(first)}`, { accessToken: null })).status, 401);
      assert.equal((await request(`/api/auth/validate-token?token=${encodeURIComponent(second)}`, { accessToken: null })).status, 200);

      const firstAccess = await request('/api/auth/first-access', { method: 'POST', accessToken: null,
        body: { token: second, password: 'senha-nova-pessoa' } });
      assert.equal(firstAccess.status, 200);
      assert.equal((await request('/api/auth/first-access', { method: 'POST', accessToken: null,
        body: { token: second, password: 'outra-senha-nova' } })).status, 400);
      const data = await readLocalData();
      assert.equal(data.users.filter(user => user.email === 'nova-pessoa@example.test').length, 1);
      assert.equal(data.users.find(user => user.email === 'nova-pessoa@example.test')?.status, 'active');
    });

    await t.test('convite preparado antes de suspender/reactivar não substitui o estado mais novo', async sub => {
      await reset();
      const initial = await request(`/api/v1/platform/companies/${companyAId}/users/invitations`, {
        method: 'POST', body: { email: 'pendente-alpha@example.test', role: 'atendente' },
      });
      assert.equal(initial.status, 201);
      const oldInvite = await outboxToken(0);
      let releaseInvite!: () => void;
      let markInvitePrepared!: () => void;
      const invitePrepared = new Promise<void>(resolve => { markInvitePrepared = resolve; });
      const inviteGate = new Promise<void>(resolve => { releaseInvite = resolve; });
      const originalChange = userRepository.changeUserAdministration.bind(userRepository);
      sub.mock.method(userRepository, 'changeUserAdministration', async (input: UserAdministrationChange) => {
        if (input.action === 'invite' && input.email === 'pendente-alpha@example.test') {
          markInvitePrepared();
          await inviteGate;
        }
        return originalChange(input);
      });

      const pendingInvite = request(`/api/v1/platform/companies/${companyAId}/users/invitations`, {
        method: 'POST', body: { email: 'pendente-alpha@example.test', role: 'atendente' },
      });
      try {
        await invitePrepared;
        await new Promise(resolve => setTimeout(resolve, 10));
        assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/${pendingUserId}/suspension`, {
          method: 'POST', body: { reason: 'Revogar convite em andamento' },
        })).status, 200);
        assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/${pendingUserId}/reactivation`, {
          method: 'POST', body: {},
        })).status, 200);
      } finally {
        releaseInvite();
      }
      assert.equal((await pendingInvite).status, 409);
      assert.equal((await request(`/api/auth/validate-token?token=${encodeURIComponent(oldInvite)}`, { accessToken: null })).status, 401);
      const state = await readLocalData();
      assert.equal(state.users.find(user => user.id === pendingUserId)?.status, 'pending');
      assert.equal(state.users.find(user => user.id === pendingUserId)?.invite_token, null);
      assert.equal(state.outbox.length, 1);
    });

    await t.test('convite global força superadmin sem empresa e rejeita campos de contexto no corpo', async () => {
      await reset();
      assert.equal((await request('/api/v1/platform/administrators/invitations', { method: 'POST', body: {
        email: 'novo-super@example.test', role: 'admin_empresa',
      } })).status, 400);
      assert.equal((await request('/api/v1/platform/administrators/invitations', { method: 'POST', body: {
        email: 'novo-super@example.test', companyId: companyAId,
      } })).status, 400);

      const response = await request('/api/v1/platform/administrators/invitations', { method: 'POST', body: {
        email: 'novo-super@example.test', name: 'Novo Superadmin',
      } });
      assert.equal(response.status, 201);
      assert.equal(response.body.data.user.role, 'super_admin');
      assert.equal(response.body.data.user.companyId, null);
      assertNoPrivateFields(response.body.data.user);
      const invite = await outboxToken(0);
      const claims = jwt.verify(invite, inviteSecret) as jwt.JwtPayload;
      assert.equal(claims.role, 'super_admin');
      assert.equal(claims.companyId, null);
      assert.equal(claims.exp! - claims.iat!, 86400);
      assert.equal((await request('/api/auth/first-access', { method: 'POST', accessToken: null,
        body: { token: invite, password: 'senha-superadmin-novo' } })).status, 200);
      const login = await request('/api/v1/users/login', { method: 'POST', accessToken: null,
        body: { email: 'novo-super@example.test', password: 'senha-superadmin-novo' } });
      assert.equal(login.status, 200);
      const session = jwt.verify(login.body.data.token, jwtSecret) as jwt.JwtPayload;
      assert.equal(session.role, 'super_admin');
      assert.equal(session.companyId, null);
    });

    await t.test('primeiro acesso recusa convites de conta excluída ou empresa inativa', async () => {
      await reset();
      const deletedInvite = await request(`/api/v1/platform/companies/${companyAId}/users/invitations`, {
        method: 'POST', body: { email: 'conta-excluida@example.test', role: 'atendente' },
      });
      assert.equal(deletedInvite.status, 201);
      const deletedToken = await outboxToken(0);
      const dataWithDeleted = JSON.parse(await readFile(dataFile, 'utf8')) as ReturnType<typeof fixture>;
      const deleted = dataWithDeleted.users.find(user => user.email === 'conta-excluida@example.test')!;
      deleted.deleted_at = '2026-11-02T10:00:00.000Z';
      deleted.status = 'blocked';
      await writeFile(dataFile, JSON.stringify(dataWithDeleted), 'utf8');
      const deniedDeleted = await request('/api/auth/first-access', { method: 'POST', accessToken: null,
        body: { token: deletedToken, password: 'senha-nova-conta' } });
      assert.equal(deniedDeleted.status, 400);
      assert.equal((await readLocalData()).users.find(user => user.email === 'conta-excluida@example.test')?.password_hash, undefined);

      await reset();
      const inactiveInvite = await request(`/api/v1/platform/companies/${companyAId}/users/invitations`, {
        method: 'POST', body: { email: 'conta-empresa-inativa@example.test', role: 'atendente' },
      });
      assert.equal(inactiveInvite.status, 201);
      const inactiveToken = await outboxToken(0);
      const dataWithInactive = JSON.parse(await readFile(dataFile, 'utf8')) as ReturnType<typeof fixture>;
      dataWithInactive.companies.find(company => company.id === companyAId)!.status = 'inativo';
      await writeFile(dataFile, JSON.stringify(dataWithInactive), 'utf8');
      const deniedInactive = await request('/api/auth/first-access', { method: 'POST', accessToken: null,
        body: { token: inactiveToken, password: 'senha-nova-conta' } });
      assert.equal(deniedInactive.status, 400);
      const persisted = await readLocalData();
      assert.equal(persisted.users.find(user => user.email === 'conta-empresa-inativa@example.test')?.status, 'pending');
      assert.equal(persisted.users.find(user => user.email === 'conta-empresa-inativa@example.test')?.password_hash, undefined);
    });

    await t.test('e-mail duplicado de conta excluída conflita e falha no envio preserva conta pendente', async sub => {
      await reset();
      assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/invitations`, {
        method: 'POST', body: { email: 'deleted@example.test', role: 'atendente' },
      })).status, 409);
      assert.equal((await request(`/api/v1/platform/companies/${companyAId}/users/${attendantId}`, {
        method: 'PUT', body: { name: 'E-mail duplicado', email: 'deleted@example.test', role: 'atendente' },
      })).status, 409);

      let renameCalls = 0;
      const originalRename = fs.rename.bind(fs);
      sub.mock.method(fs, 'rename', async (from: Parameters<typeof fs.rename>[0], to: Parameters<typeof fs.rename>[1]) => {
        renameCalls += 1;
        if (renameCalls === 2) throw new Error('Falha sintética do outbox');
        return originalRename(from, to);
      });
      syncBuiltinESMExports();
      let failed: { status: number; body: any };
      try {
        failed = await request(`/api/v1/platform/companies/${companyAId}/users/invitations`, {
          method: 'POST', body: { email: 'email-falha@example.test', role: 'atendente' },
        });
      } finally {
        sub.mock.restoreAll();
        syncBuiltinESMExports();
      }
      assert.equal(failed!.status, 502);
      const persisted = await readLocalData();
      const pending = persisted.users.filter(user => user.email === 'email-falha@example.test');
      assert.equal(pending.length, 1);
      assert.equal(pending[0].status, 'pending');
      assert.ok(pending[0].invite_token);
      assert.equal(persisted.outbox.some(message => message.email === 'email-falha@example.test'), false);
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
