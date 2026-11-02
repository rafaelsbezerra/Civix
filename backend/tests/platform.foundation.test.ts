import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import bcrypt from 'bcrypt';

const directory = await mkdtemp(join(tmpdir(), 'civix-platform-foundation-'));
Object.assign(process.env, { USE_MOCK_DATA: 'true', MOCK_DATA_DIR: directory, JWT_SECRET: 'segredo-sintetico-platform', LOG_LEVEL: 'fatal' });
const companyId = randomUUID();
const ids = { super_admin: randomUUID(), admin_empresa: randomUUID(), atendente: randomUUID(), cliente: randomUUID() };
const hash = await bcrypt.hash('senha-sintetica-testes', 4);
const company = { id: companyId, nome: 'Empresa sintética', cnpj: '12345678000190', descricao: 'Resumo', descricao_detalhada: 'Detalhes', categoria: 'Serviços', cidade: 'Fortaleza', estado: 'CE', status: 'ativo', verificado: false, tamanho: 'pequena' };
const planInput = { name: 'Plano sintético', slug: 'plano-sintetico', description: 'Descrição', price: '39.90', billingPeriod: 'monthly', features: ['Recurso'], limits: { users: 5 }, isFeatured: false, isActive: true, displayOrder: 1 };
function fixture() {
  return { version: 1, companies: [company], users: Object.entries(ids).map(([role, id]) => ({ id, role, email: role + '@example.test', name: 'Pessoa sintética', password_hash: hash, status: 'active', company_id: ['admin_empresa', 'atendente'].includes(role) ? companyId : null })), plans: [], images: [], outbox: [], sales: [], companyRegistrationOperations: [] };
}

test('fundação da plataforma com HTTP e persistência JSON isolados', async t => {
  const { app } = await import('../src/app.js');
  const { signToken } = await import('../src/services/auth.service.js');
  const { readLocalData, updateLocalData } = await import('../src/persistence/json/local.store.js');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = 'http://127.0.0.1:' + address.port;
  function token(role: keyof typeof ids = 'super_admin') {
    return signToken({ id: ids[role], role, email: role + '@example.test', companyId: ['admin_empresa', 'atendente'].includes(role) ? companyId : null, tokenVersion: 2 }, '1h');
  }
  async function request(path: string, method = 'GET', body?: unknown, bearer: string | null = token()) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  async function reset() { await writeFile(join(directory, 'data.json'), JSON.stringify(fixture())); }
  async function createPlan(overrides = {}) {
    const response = await request('/api/v1/platform/plans', 'POST', { ...planInput, ...overrides });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    return response.body.data;
  }
  function registration(planId: string) {
    const { id: _id, status: _status, verificado: _verified, ...fields } = company;
    return { ...fields, nome: 'Nova empresa', cnpj: '98765432000190', planId: String(planId), operationId: randomUUID() };
  }
  try {
    await t.test('protege todas as operações com sessão atual e perfil de superadmin', async () => {
      await reset();
      const operations: [string, string, unknown?][] = [['/plans', 'GET'], ['/plans', 'POST', planInput], ['/plans/missing', 'PUT', planInput], ['/plans/missing/activation', 'POST', { active: false }], ['/companies', 'POST', {}]];
      for (const [path, method, body] of operations) {
        assert.equal((await request('/api/v1/platform' + path, method, body, null)).status, 401);
        for (const role of ['admin_empresa', 'atendente'] as const) assert.equal((await request('/api/v1/platform' + path, method, body, token(role))).status, 403);
        assert.equal((await request('/api/v1/platform' + path, method, body, token('cliente'))).status, 401);
      }
      const oldToken = token();
      await updateLocalData(data => { const user = data.users.find(user => user.id === ids.super_admin)!; user.role = 'admin_empresa'; user.company_id = companyId; });
      assert.equal((await request('/api/v1/platform/plans', 'GET', undefined, oldToken)).status, 401);
    });

    await t.test('perfil próprio rejeita mass assignment, conflito de e-mail e revoga token após alterar e-mail', async () => {
      await reset();
      for (const extra of [{ role: 'admin_empresa' }, { companyId }, { id: ids.atendente }, { password_hash: 'indevido' }]) {
        assert.equal((await request('/api/v1/users/profile', 'PUT', { name: 'Novo nome', email: 'super_admin@example.test', ...extra })).status, 400);
      }
      assert.equal((await request('/api/v1/users/profile', 'PUT', { name: 'Novo nome', email: 'ADMIN_EMPRESA@example.test' })).status, 409);
      const unchanged = await request('/api/v1/users/profile', 'PUT', { name: 'Novo nome', email: 'super_admin@example.test' });
      assert.equal(unchanged.status, 200); assert.equal(unchanged.body.data.requiresLogin, false);
      const changed = await request('/api/v1/users/profile', 'PUT', { name: 'Novo nome', email: 'novo@example.test' });
      assert.equal(changed.status, 200); assert.equal(changed.body.data.requiresLogin, true);
      assert.equal(changed.body.data.user.id, ids.super_admin);
      assert.equal((await request('/api/v1/users/profile')).status, 401);
      const data = await readLocalData();
      assert.equal(data.users.find(user => user.id === ids.super_admin)?.role, 'super_admin');
      assert.equal(data.users.find(user => user.id === ids.atendente)?.email, 'atendente@example.test');
    });

    await t.test('IDs numéricos locais legados permanecem compatíveis com autenticação e perfil próprio', async () => {
      await reset();
      await updateLocalData(data => { data.users.find(user => user.id === ids.super_admin)!.id = 42; });
      const bearer = signToken({ id: 42, email: 'super_admin@example.test', role: 'super_admin', companyId: null, tokenVersion: 2 }, '1h');
      assert.equal((await request('/api/v1/platform/plans', 'GET', undefined, bearer)).status, 200);
      const response = await request('/api/v1/users/profile', 'PUT', { name: 'Nome legado', email: 'super_admin@example.test' }, bearer);
      assert.equal(response.status, 200); assert.equal(response.body.data.user.id, 42);
    });

    await t.test('CRUD de planos mantém preço decimal, inclui inativos e valida slug/preço', async () => {
      await reset();
      const plan = await createPlan();
      assert.equal(String(plan.price), '39.90');
      assert.equal((await request('/api/v1/platform/plans', 'POST', planInput)).status, 409);
      for (const price of ['0', '0.00', '1.001', '10000000000', 10]) assert.equal((await request('/api/v1/platform/plans', 'POST', { ...planInput, slug: 'outro', price })).status, 400);
      const updated = await request('/api/v1/platform/plans/' + plan.id, 'PUT', { ...planInput, name: 'Plano alterado', price: '49.9' });
      assert.equal(updated.status, 200); assert.equal(String(updated.body.data.price), '49.90');
      assert.equal((await request('/api/v1/platform/plans/' + plan.id + '/activation', 'POST', { active: false })).status, 200);
      const all = await request('/api/v1/platform/plans');
      assert.equal(all.status, 200); assert.equal(all.body.data.length, 1);
      assert.equal((await request('/api/v1/platform/plans/' + plan.id)).status, 200);
      const publicPlans = await request('/api/v1/plans', 'GET', undefined, null);
      assert.equal(publicPlans.body.data.length, 0);
      assert.equal((await request('/api/v1/platform/plans/' + plan.id + '/activation', 'POST', { active: true })).status, 200);
    });

    await t.test('plano legado com preço zero não pode ser ativado e pode ser desativado', async () => {
      await reset();
      await updateLocalData(data => {
        data.plans.push({ id: 'legacy-zero', name: 'Plano legado', slug: 'legacy-zero', description: 'Fixture sintética',
          price: '0.00', billing_period: 'monthly', features: [], limits: {}, is_featured: false,
          is_active: false, display_order: 0 });
      });
      assert.equal((await request('/api/v1/platform/plans/legacy-zero/activation', 'POST', { active: true })).status, 400);
      assert.equal((await readLocalData()).plans[0].is_active, false);
      assert.equal((await request('/api/v1/platform/plans/legacy-zero/activation', 'POST', { active: false })).status, 200);
      assert.equal((await readLocalData()).plans[0].is_active, false);
    });

    await t.test('cadastro cria uma venda inicial, replay não duplica e preço histórico não muda', async () => {
      await reset();
      const plan = await createPlan();
      const payload = registration(plan.id);
      const created = await request('/api/v1/platform/companies', 'POST', payload);
      assert.equal(created.status, 201, JSON.stringify(created.body));
      assert.equal(created.body.data.replayed, false);
      assert.equal(created.body.data.sale.amount, '39.90');
      assert.equal(created.body.data.sale.companyId, created.body.data.company.id);
      const replay = await request('/api/v1/platform/companies', 'POST', payload);
      assert.ok([200, 201].includes(replay.status));
      assert.equal(replay.body.data.replayed, true);
      assert.equal(replay.body.data.company.id, created.body.data.company.id);
      assert.equal((await request('/api/v1/platform/companies', 'POST', { ...payload, nome: 'Outra empresa' })).status, 409);
      await request('/api/v1/platform/plans/' + plan.id, 'PUT', { ...planInput, price: '99.00' });
      const data = await readLocalData();
      assert.equal(data.companies.length, 2); assert.equal(data.sales.length, 1);
      assert.equal(data.companyRegistrationOperations.length, 1);
      assert.equal(data.sales[0].amount, '39.90'); assert.equal(data.sales[0].planPrice, '39.90');
    });

    await t.test('repetições concorrentes geram uma única empresa e venda inicial', async () => {
      await reset(); const plan = await createPlan(); const payload = registration(plan.id);
      const responses = await Promise.all([request('/api/v1/platform/companies', 'POST', payload), request('/api/v1/platform/companies', 'POST', payload)]);
      assert.ok(responses.every(response => [200, 201].includes(response.status)), JSON.stringify(responses));
      assert.deepEqual(responses.map(response => response.body.data.replayed).sort(), [false, true]);
      const data = await readLocalData(); assert.equal(data.sales.length, 1); assert.equal(data.companies.length, 2);
    });

    await t.test('rota legada exige os mesmos dados e recibo sem venda não recria registros', async () => {
      await reset(); const plan = await createPlan(); const payload = registration(plan.id);
      const { operationId: _operation, ...incomplete } = payload;
      assert.equal((await request('/api/v1/empresas', 'POST', incomplete)).status, 400);
      const created = await request('/api/v1/empresas', 'POST', payload);
      assert.equal(created.status, 201);
      await updateLocalData(data => { data.sales = []; });
      const before = await readLocalData();
      assert.equal((await request('/api/v1/platform/companies', 'POST', payload)).status, 409);
      assert.deepEqual(await readLocalData(), before);
    });

    await t.test('plano inativo/ausente e duplicidade não deixam cadastro parcial', async () => {
      await reset(); const plan = await createPlan({ isActive: false });
      const before = await readLocalData();
      for (const planId of [String(plan.id), 'unknown']) {
        const response = await request('/api/v1/platform/companies', 'POST', registration(planId));
        assert.ok([400, 404, 409].includes(response.status));
        assert.deepEqual(await readLocalData(), before);
      }
      await request('/api/v1/platform/plans/' + plan.id + '/activation', 'POST', { active: true });
      const response = await request('/api/v1/platform/companies', 'POST', { ...registration(plan.id), cnpj: company.cnpj });
      assert.equal(response.status, 409);
      const data = await readLocalData(); assert.equal(data.companies.length, 1); assert.equal(data.sales.length, 0); assert.equal(data.companyRegistrationOperations.length, 0);
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
