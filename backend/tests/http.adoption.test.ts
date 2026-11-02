import assert from 'node:assert/strict';
import { once } from 'node:events';
import test, { type TestContext } from 'node:test';
import bcrypt from 'bcrypt';
import express, { type Express } from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { db } from '../src/shared/config/data.js';
import { AppError } from '../src/shared/errors/app.error.js';
import { ErrorCode } from '../src/shared/errors/error.code.js';
import { createErrorHandler, createNotFoundHandler } from '../src/middlewares/error.handler.js';
import authRoutes from '../src/routes/auth.routes.js';
import planRoutes from '../src/routes/plan.routes.js';
import * as adminService from '../src/services/admin.service.js';

const environment = {
  JWT_SECRET: 'segredo-local-teste', JWT_INVITE_SECRET: 'convite-local-teste', JWT_RESET_SECRET: 'reset-local-teste',
  RESEND_API_KEY: 're_local_test', MAIL_FROM: 'Civix <noreply@example.test>', FRONTEND_URL: 'http://frontend.example.test',
};
type Query = (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number }>;
const planRow = {
  id: 1, name: 'Plano Inicial', slug: 'inicial', description: 'Plano de teste', price: 19.9,
  billing_period: 'monthly', features: ['Catálogo', 4], limits: { members: 3, discarded: null },
  is_featured: false, is_active: true, display_order: 1,
};
const plan = {
  id: '1', name: 'Plano Inicial', slug: 'inicial', description: 'Plano de teste', price: '19.9',
  billingPeriod: 'monthly', features: ['Catálogo'], limits: { members: 3 },
  isFeatured: false, isActive: true, displayOrder: 1,
};

async function withServer(app: Express, run: (url: string) => Promise<void>) {
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

async function withRoutes(t: TestContext, query: Query, run: (url: string) => Promise<void>, mail?: (path: string, payload: Record<string, unknown>) => Promise<unknown>) {
  const previous = Object.fromEntries(Object.keys(environment).map(key => [key, process.env[key]]));
  Object.assign(process.env, environment);
  t.mock.method(db, 'query', query);
  t.mock.method(Resend.prototype, 'post', mail ?? (async () => { throw new Error('Envio externo não esperado'); }));
  t.mock.method(console, 'error', () => {});
  const app = express();
  app.use(express.json());
  app.use('/api/v1', authRoutes);
  app.use('/api/v1/plans', planRoutes);
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ environment: 'production' }));
  try {
    await withServer(app, run);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

async function request(url: string, path: string, body?: unknown, role?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (role) headers.Authorization = `Bearer ${jwt.sign({ id: 'user-id', email: 'pessoa@example.test', role, companyId: companyId, tokenVersion: 2 }, environment.JWT_SECRET)}`;
  const response = await fetch(url + path, {
    method: body === undefined ? 'GET' : 'POST', headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

async function unreachableQuery(): Promise<{ rows: Record<string, unknown>[] }> {
  throw new Error('Consulta de persistência não esperada');
}

const companyId = '10000000-0000-4000-8000-000000000001';
const account = { id: 'user-id', email: 'pessoa@example.test', role: 'admin_empresa', company_id: companyId, status: 'active', password_hash: 'hash-apenas-contexto' };
function invite() {
  return jwt.sign({ email: account.email, role: account.role, companyId, purpose: 'invite' }, environment.JWT_INVITE_SECRET);
}

test('Convite valida propósito, empresa, estado e token antes da ativação bcrypt', async t => {
  const token = invite();
  let scenario = 'valid';
  const calls: { text: string; values?: unknown[] }[] = [];
  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });
    if (scenario === 'database') throw new Error('Falha SQL confidencial');
    if (text.includes('FROM companies')) return { rows: [{ id: companyId, status: 'ativo' }] };
    if (text.includes('UPDATE')) return { rows: [], rowCount: scenario === 'race' ? 0 : 1 };
    return { rows: scenario === 'missing' ? [] : [{ ...account, status: scenario === 'active' ? 'active' : 'pending', invite_token: scenario === 'used' ? 'outro' : token }] };
  }, async url => {
    assert.equal((await request(url, '/api/v1/auth/validate-token')).status, 400);
    const path = '/api/v1/auth/validate-token?token=' + encodeURIComponent(token);
    assert.deepEqual(await request(url, path), { status: 200, body: { data: { email: account.email } } });
    const lookup = calls.find(call => call.text.includes('FROM users'))!;
    assert.match(lookup.text, /LOWER\(email\) = LOWER\(\$1\) AND role = \$2/);
    assert.deepEqual(lookup.values, [account.email, account.role]);
    for (const [next, status] of [['active', 400], ['used', 401], ['missing', 404], ['database', 500]] as const) {
      scenario = next;
      assert.equal((await request(url, path)).status, status);
    }
    scenario = 'valid';
    const activated = await request(url, '/api/v1/auth/first-access', { token, password: 'senha-local' });
    assert.equal(activated.status, 200);
    assert.ok(activated.body.data.message);
    const update = calls.find(call => call.text.includes('UPDATE'))!;
    assert.match(update.text, /status = 'pending'/);
    const hash = update.values![0] as string;
    assert.equal(bcrypt.getRounds(hash), 10);
    assert.equal(await bcrypt.compare('senha-local', hash), true);
    scenario = 'race';
    assert.equal((await request(url, '/api/v1/auth/first-access', { token, password: 'senha-local' })).status, 401);
  });
});

test('Convites inválidos, expirados, legados ou sem propósito não consultam persistência', async t => {
  await withRoutes(t, unreachableQuery, async url => {
    const tokens = ['invalido', jwt.sign({ email: account.email, role: 'empresa' }, environment.JWT_INVITE_SECRET),
      jwt.sign({ email: account.email, role: account.role, companyId, purpose: 'invite' }, environment.JWT_INVITE_SECRET, { expiresIn: -1 }),
      jwt.sign({ email: account.email, role: account.role, companyId, purpose: 'reset' }, environment.JWT_INVITE_SECRET)];
    for (const token of tokens) assert.equal((await request(url, '/api/v1/auth/validate-token?token=' + encodeURIComponent(token))).status, 401);
    assert.equal((await request(url, '/api/v1/auth/first-access', {})).status, 400);
    assert.equal((await request(url, '/api/v1/auth/first-access', { token: 'invalido', password: 'curta' })).status, 400);
  });
});

test('Reconvite preserva perfil e vínculo e detecta atualização concorrente', async t => {
  let status = 'pending';
  let rowCount = 1;
  let mailCalls = 0;
  const calls: { text: string; values?: unknown[] }[] = [];
  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });
    if (text.includes('FROM companies')) return { rows: [{ id: companyId, status: 'ativo' }] };
    return text.includes('UPDATE') ? { rows: [], rowCount }
      : { rows: [{ ...account, status, invite_token: 'anterior' }] };
  }, async () => {
    await adminService.inviteUser(account.email, 'admin_empresa', companyId);
    assert.equal(mailCalls, 1);
    const update = calls.find(call => call.text.includes('UPDATE'))!;
    assert.match(update.text, /company_id = \$5 AND role = \$1/);
    assert.equal(update.values![4], companyId);
    rowCount = 0;
    await assert.rejects(adminService.inviteUser(account.email, 'admin_empresa', companyId), { status: 409 });
    status = 'active';
    await assert.rejects(adminService.inviteUser(account.email, 'admin_empresa', companyId), { status: 409 });
    await assert.rejects(adminService.inviteUser(account.email, 'atendente', companyId), { status: 409 });
    assert.equal(mailCalls, 1);
  }, async () => { mailCalls++; return { data: { id: 'mail-local' }, error: null }; });
});

test('Planos preservam envelope, autorização e parâmetros do usuário vigente', async t => {
  let role = 'admin_empresa';
  let failure = false;
  let missing = false;
  const calls: { text: string; values?: unknown[] }[] = [];
  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });
    if (text.includes('FROM users')) return { rows: [{ ...account, role }] };
    if (text.includes('FROM companies')) return { rows: [{ id: companyId, status: 'ativo' }] };
    if (failure) throw new Error('Falha SQL confidencial');
    if (text.includes('UPDATE')) return { rows: [{ id: account.id }], rowCount: 1 };
    return { rows: missing ? [] : [planRow] };
  }, async url => {
    assert.deepEqual(await request(url, '/api/v1/plans'), { status: 200, body: { data: [plan] } });
    assert.deepEqual(await request(url, '/api/v1/plans/selection', { planId: '1' }, role), { status: 200, body: { data: plan } });
    assert.deepEqual(calls.find(call => call.text.includes('UPDATE'))!.values, [1, account.id]);
    assert.equal((await request(url, '/api/v1/plans/selection', {}, role)).status, 400);
    role = 'atendente';
    assert.equal((await request(url, '/api/v1/plans/selection', { planId: '1' }, role)).status, 403);
    role = 'admin_empresa'; missing = true;
    assert.equal((await request(url, '/api/v1/plans/selection', { planId: '1' }, role)).status, 400);
    failure = true;
    assert.equal((await request(url, '/api/v1/plans')).status, 500);
  });
});

test('Reenvio de convite mantém resposta antienumeração, token persistido e envio isolado', async t => {
  const calls: { text: string; values?: unknown[] }[] = [];
  let found = false;
  let mailCalls = 0;
  const message = 'Se o e-mail estiver cadastrado, um link de redefinição será enviado.';
  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });
    if (text.includes('FROM companies')) return { rows: [{ id: companyId, status: 'ativo' }] };
    return { rows: text.includes('SELECT') && found ? [{ ...account, status: 'pending', invite_token: 'anterior' }] : [], rowCount: 1 };
  }, async url => {
    assert.deepEqual(await request(url, '/api/v1/auth/resend-invite-email', {}), { status: 400, body: { status: 400, message: 'Email é obrigatório.' } });
    for (const nextFound of [false, true]) {
      found = nextFound;
      assert.deepEqual(await request(url, '/api/v1/auth/resend-invite-email', { email: 'pessoa@example.test' }), { status: 200, body: { data: { message } } });
    }
    assert.equal(mailCalls, 1);
    const update = calls.at(-1)!;
    assert.match(update.text, /UPDATE users/);
    const payload = jwt.verify(update.values?.[2] as string, environment.JWT_INVITE_SECRET) as jwt.JwtPayload;
    assert.equal(payload.role, 'admin_empresa');
    assert.equal(payload.companyId, companyId);
    assert.equal(payload.purpose, 'invite');
    assert.equal(payload.exp! - payload.iat!, 86400);
  }, async (path, payload) => {
    mailCalls++;
    assert.equal(path, '/emails');
    assert.match(calls.at(-1)!.text, /UPDATE/);
    assert.deepEqual(payload.to, ['pessoa@example.test']);
    return { data: { id: 'mail-local' }, error: null };
  });
});

test('Handler de staging preserva causa e pilha sanitizadas sem expor senhas, tokens ou URL de banco', async () => {
  const app = express();
  app.get('/failure', () => {
    throw new AppError({ status: 500, code: ErrorCode.INTERNAL_ERROR, message: 'Erro interno do servidor',
      cause: new Error('postgresql://user:credencialConfidencial@localhost/database token=tokenConfidencial'),
      details: { password: 'senhaConfidencial', field: 'email' } });
  });
  app.use(createErrorHandler({ environment: 'staging' }));
  await withServer(app, async url => {
    const response = await fetch(url + '/failure');
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.code, ErrorCode.INTERNAL_ERROR);
    assert.match(body.stack, /AppError/);
    assert.ok(body.details.cause.stack);
    const serialized = JSON.stringify(body);
    assert.ok(serialized.includes('[REMOVIDO]'));
    assert.ok(serialized.includes('email'));
    for (const secret of ['credencialConfidencial', 'tokenConfidencial', 'senhaConfidencial']) assert.ok(!serialized.includes(secret));
  });
});

test('Bootstrap real aplica contratos ao root, JSON inválido, corpo excessivo e 404 global', async t => {
  t.mock.method(db, 'query', unreachableQuery);
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const { app } = await import('../src/app.js');
    await withServer(app, async url => {
      const root = await fetch(url);
      assert.equal(root.status, 200);
      const body = await root.json();
      assert.deepEqual(Object.keys(body), ['data']);
      const missing = await fetch(url + '/rota-inexistente');
      assert.equal(missing.status, 404);
      assert.deepEqual(await missing.json(), { status: 404, message: 'Recurso não encontrado' });
      const malformed = await fetch(url + '/api/v1/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
      assert.equal(malformed.status, 400);
      const malformedBody = await malformed.json();
      assert.equal(malformedBody.status, 400);
      assert.deepEqual(Object.keys(malformedBody).sort(), ['message', 'status']);
      assert.equal(typeof malformedBody.message, 'string');
      const oversized = await fetch(url + '/api/v1/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'x'.repeat(110 * 1024), role: 'cliente' }),
      });
      assert.equal(oversized.status, 413);
      assert.deepEqual(await oversized.json(), {
        status: 413,
        message: 'Corpo da requisição excede o limite permitido',
      });
    });
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
