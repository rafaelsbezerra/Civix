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
  if (role) headers.Authorization = `Bearer ${jwt.sign({ id: 'user-id', role }, environment.JWT_SECRET)}`;
  const response = await fetch(url + path, {
    method: body === undefined ? 'GET' : 'POST', headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

async function unreachableQuery(): Promise<{ rows: Record<string, unknown>[] }> {
  throw new Error('Consulta de persistência não esperada');
}

test('Validação de convite consulta users pelo e-mail e perfil do JWT e retorna data', async t => {
  const token = jwt.sign({ email: 'pessoa@example.test', role: 'empresa' }, environment.JWT_INVITE_SECRET);
  let scenario = 'valid';
  const calls: { text: string; values?: unknown[] }[] = [];

  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });

    if (scenario === 'database') throw new Error('SQL confidencial');

    return { rows: scenario === 'missing' ? [] : [{ id: 'user-id', email: 'pessoa@example.test', role: 'empresa', status: scenario === 'active' ? 'active' : 'pending', invite_token: scenario === 'used' ? 'outro-convite' : token }] };
  }, async url => {
    assert.deepEqual(await request(url, '/api/v1/auth/validate-token'), { status: 400, body: { status: 400, message: 'Token de convite ausente.' } });
    assert.equal(calls.length, 0);
    assert.deepEqual(await request(url, '/api/v1/auth/validate-token?token=' + encodeURIComponent(token)), { status: 200, body: { data: { email: 'pessoa@example.test' } } });
    assert.deepEqual(calls.at(-1)?.values, ['pessoa@example.test', 'empresa']);
    assert.match(calls.at(-1)!.text, /FROM users WHERE email = \$1 AND role = \$2/);

    for (const [nextScenario, status, message] of [
      ['active', 400, 'Esta conta já foi ativada anteriormente.'],
      ['used', 401, 'Este link de convite já foi utilizado ou é inválido.'],
      ['missing', 404, 'Usuário não encontrado.'],
      ['database', 500, 'Erro interno do servidor'],
    ] as const) {
      scenario = nextScenario;
      assert.deepEqual(await request(url, '/api/v1/auth/validate-token?token=' + encodeURIComponent(token)), { status, body: { status, message } });
    }
  });
});

test('Pré-validação rejeita JWT inválido, expirado ou sem identidade antes da persistência', async t => {
  const expired = jwt.sign({ email: 'pessoa@example.test', role: 'empresa' }, environment.JWT_INVITE_SECRET, { expiresIn: -1 });
  const wrongSecret = jwt.sign({ email: 'pessoa@example.test', role: 'empresa' }, 'outra-chave-sintetica');
  const withoutIdentity = jwt.sign({ userId: 'user-id' }, environment.JWT_INVITE_SECRET);

  await withRoutes(t, unreachableQuery, async url => {
    for (const token of ['token-invalido', expired, wrongSecret, withoutIdentity]) {
      const response = await request(url, '/api/v1/auth/validate-token?token=' + encodeURIComponent(token));

      assert.equal(response.status, 401);
      assert.equal(response.body.status, 401);
      assert.equal(response.body.message, 'Link de convite inválido ou expirado.');
    }
  });
});

test('Primeiro acesso preserva validações e rejeita JWT inválido antes de consultar o banco', async t => {
  await withRoutes(t, unreachableQuery, async url => {
    for (const [body, status, message] of [
      [{}, 400, 'Token e senha são obrigatórios.'],
      [{ token: 'convite-local', password: 'curta' }, 400, 'A senha deve conter no mínimo 8 caracteres.'],
      [{ token: 'convite-local', password: 'senha-local' }, 401, 'Link de convite inválido ou expirado.'],
    ] as const) assert.deepEqual(await request(url, '/api/v1/auth/first-access', body), { status, body: { status, message } });
  });
});

test('Primeiro acesso ativa users por ID e token com bcrypt10 e sucesso sob data', async t => {
  const token = jwt.sign({ email: 'pessoa@example.test', role: 'empresa' }, environment.JWT_INVITE_SECRET);
  const calls: { text: string; values?: unknown[] }[] = [];
  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });
    return { rows: text.includes('SELECT') ? [{ id: 'user-id', email: 'pessoa@example.test', role: 'empresa', status: 'pending', invite_token: token }] : [], rowCount: text.includes('UPDATE') ? 1 : undefined };
  }, async url => {
    assert.deepEqual(await request(url, '/api/v1/auth/first-access', { token, password: 'senha-local' }), {
      status: 200, body: { data: { message: 'Senha cadastrada com sucesso! Sua conta está ativa.' } },
    });
    assert.match(calls[0]!.text, /FROM users WHERE email = \$1 AND role = \$2/);
    assert.deepEqual(calls[0]!.values, ['pessoa@example.test', 'empresa']);
    const hash = calls[1]!.values?.[0] as string;
    assert.equal(bcrypt.getRounds(hash), 10);
    assert.equal(await bcrypt.compare('senha-local', hash), true);
    assert.match(calls[1]!.text, /UPDATE users/);
    assert.match(calls[1]!.text, /WHERE id = \$4 AND invite_token = \$5/);
    assert.match(calls[1]!.text, /status IS DISTINCT FROM 'active'/);
    assert.deepEqual(calls[1]!.values?.slice(1), ['active', null, 'user-id', token]);
  });
});

test('Primeiro acesso rejeita consumo concorrente quando o ID e token não são atualizados', async t => {
  const token = jwt.sign({ email: 'pessoa@example.test', role: 'empresa' }, environment.JWT_INVITE_SECRET);
  const calls: { text: string; values?: unknown[] }[] = [];

  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });

    return text.includes('SELECT')
      ? { rows: [{ id: 'user-id', email: 'pessoa@example.test', role: 'empresa', status: 'pending', invite_token: token }] }
      : { rows: [], rowCount: 0 };
  }, async url => {
    const result = await request(url, '/api/v1/auth/first-access', { token, password: 'senha-local' });

    assert.equal(result.status, 401);
    assert.equal(result.body.status, 401);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1]!.values?.slice(1), ['active', null, 'user-id', token]);
  });
});

test('Reconvite concorrente que não altera users retorna conflito antes de enviar e-mail', async t => {
  const calls: { text: string; values?: unknown[] }[] = [];
  let mailCalls = 0;

  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });

    return text.includes('SELECT')
      ? { rows: [{ id: 'user-id', email: 'pessoa@example.test', role: 'empresa', status: 'pending', invite_token: 'convite-antigo' }] }
      : { rows: [], rowCount: 0 };
  }, async () => {
    await assert.rejects(adminService.inviteUser('pessoa@example.test', 'empresa'), { status: 409, code: ErrorCode.CONFLICT });

    assert.equal(calls.length, 2);
    assert.match(calls[1]!.text, /UPDATE users/);
    assert.match(calls[1]!.text, /WHERE id = \$4/);
    assert.match(calls[1]!.text, /status IS NOT NULL/);
    assert.match(calls[1]!.text, /status <> 'active'/);
    assert.match(calls[1]!.text, /RETURNING id/);
    assert.equal(calls[1]!.values?.[3], 'user-id');
    assert.equal(mailCalls, 0);
  }, async () => {
    mailCalls++;

    return { data: { id: 'mail-id' }, error: null };
  });
});

test('Reconvite atualiza users por ID para status não ativo antes de enviar e-mail', async t => {
  const calls: { text: string; values?: unknown[] }[] = [];
  let mailCalls = 0;
  let status = 'pending';

  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });

    return text.includes('SELECT')
      ? { rows: [{ id: 'user-id', email: 'pessoa@example.test', role: 'empresa', status, invite_token: 'convite-antigo' }] }
      : { rows: [{ id: 'user-id' }], rowCount: 1 };
  }, async () => {
    for (const currentStatus of ['pending', 'inactive']) {
      status = currentStatus;
      await adminService.inviteUser('pessoa@example.test', 'empresa');

      const update = calls.at(-1)!;

      assert.match(update.text, /UPDATE users/);
      assert.match(update.text, /WHERE id = \$4/);
      assert.match(update.text, /status IS NOT NULL/);
      assert.match(update.text, /status <> 'active'/);
      assert.deepEqual(update.values?.slice(0, 2), ['empresa', 'pending']);
      assert.equal(update.values?.[3], 'user-id');
    }

    assert.equal(mailCalls, 2);
  }, async () => {
    assert.match(calls.at(-1)!.text, /UPDATE users/);
    mailCalls++;

    return { data: { id: 'mail-id' }, error: null };
  });
});

test('Reenvio de convite mantém resposta antienumeração, token persistido e envio isolado', async t => {
  const calls: { text: string; values?: unknown[] }[] = [];
  let found = false;
  let mailCalls = 0;
  const message = 'Se o e-mail estiver cadastrado, um link de redefinição será enviado.';
  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });
    return { rows: text.includes('SELECT') && found ? [{ id: 'user-id', email: 'pessoa@example.test' }] : [] };
  }, async url => {
    assert.deepEqual(await request(url, '/api/v1/auth/resend-invite-email', {}), { status: 400, body: { status: 400, message: 'Email é obrigatório.' } });
    for (const nextFound of [false, true]) {
      found = nextFound;
      assert.deepEqual(await request(url, '/api/v1/auth/resend-invite-email', { email: 'pessoa@example.test' }), { status: 200, body: { data: { message } } });
    }
    assert.equal(mailCalls, 1);
    const update = calls.at(-1)!;
    assert.match(update.text, /UPDATE users SET reset_password_token = \$1 WHERE id = \$2/);
    const payload = jwt.verify(update.values?.[0] as string, environment.JWT_RESET_SECRET) as jwt.JwtPayload;
    assert.equal(payload.userId, 'user-id');
    assert.equal(payload.exp! - payload.iat!, 3600);
  }, async (path, payload) => {
    mailCalls++;
    assert.equal(path, '/emails');
    assert.match(calls.at(-1)!.text, /UPDATE/);
    assert.deepEqual(payload.to, ['pessoa@example.test']);
    return { data: { id: 'mail-local' }, error: null };
  });
});

test('Planos usam data sem aliases legados e seleção mantém consultas parametrizadas', async t => {
  const calls: { text: string; values?: unknown[] }[] = [];
  await withRoutes(t, async (text, values) => {
    calls.push({ text, values });
    return { rows: text.includes('UPDATE') ? [{ id: 'user-id' }] : [planRow], rowCount: 1 };
  }, async url => {
    assert.deepEqual(await request(url, '/api/v1/plans'), { status: 200, body: { data: [plan] } });
    assert.deepEqual(await request(url, '/api/v1/plans/selection', { planId: '1' }, 'empresa'), { status: 200, body: { data: plan } });
    assert.deepEqual(calls[1]!.values, ['1']);
    assert.deepEqual(calls[2]!.values, [1, 'user-id']);
    assert.match(calls[2]!.text, /UPDATE users SET plan_id/);
  });
});

test('Seleção de planos diferencia validação, autorização, plano ausente e falhas SQL', async t => {
  let scenario = 'missing';
  let queries = 0;
  await withRoutes(t, async () => {
    queries++;
    if (scenario === 'database') throw new Error('SQL confidencial');
    return { rows: [] };
  }, async url => {
    assert.deepEqual(await request(url, '/api/v1/plans/selection', {}, 'empresa'), { status: 400, body: { status: 400, message: 'planId e obrigatorio.' } });
    assert.deepEqual(await request(url, '/api/v1/plans/selection', { planId: '1' }, 'cliente'), { status: 403, body: { status: 403, message: 'Apenas empresas podem selecionar um plano.' } });
    assert.equal(queries, 0);
    assert.deepEqual(await request(url, '/api/v1/plans/selection', { planId: '1' }, 'empresa'), { status: 400, body: { status: 400, message: 'Plano inexistente, inativo ou usuario nao encontrado.' } });
    scenario = 'database';
    for (const path of ['/api/v1/plans', '/api/v1/plans/selection']) {
      assert.deepEqual(await request(url, path, path.endsWith('selection') ? { planId: '1' } : undefined, 'empresa'), { status: 500, body: { status: 500, message: 'Erro interno do servidor' } });
    }
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

test('Primeiro acesso e reenvio preservam erros esperados e ocultam falhas SQL e de e-mail', async t => {
  const token = jwt.sign({ email: 'pessoa@example.test', role: 'empresa' }, environment.JWT_INVITE_SECRET);
  let scenario = 'missing';
  await withRoutes(t, async text => {
    if (scenario === 'database') throw new Error('Falha SQL confidencial');
    if (text.includes('UPDATE')) return { rows: [] };
    return { rows: scenario === 'missing' ? [] : [{ id: 'user-id', email: 'pessoa@example.test', status: scenario === 'active' ? 'active' : 'pending', invite_token: scenario === 'used' ? 'outro-convite' : token }] };
  }, async url => {
    for (const [nextScenario, status, message] of [
      ['missing', 404, 'Usuário não encontrado.'],
      ['active', 400, 'Esta conta já foi ativada anteriormente.'],
      ['used', 401, 'Este link de convite já foi utilizado ou é inválido.'],
      ['database', 500, 'Erro interno do servidor'],
    ] as const) {
      scenario = nextScenario;
      assert.deepEqual(await request(url, '/api/v1/auth/first-access', { token, password: 'senha-local' }), { status, body: { status, message } });
    }
    for (const nextScenario of ['database', 'mail']) {
      scenario = nextScenario;
      assert.deepEqual(await request(url, '/api/v1/auth/resend-invite-email', { email: 'pessoa@example.test' }), { status: 500, body: { status: 500, message: 'Erro interno do servidor' } });
    }
  }, async () => ({ data: null, error: { message: 'Falha simulada no envio' } }));
});
