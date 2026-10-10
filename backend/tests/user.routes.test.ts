import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import test, { type TestContext } from 'node:test';
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { db } from '../src/shared/config/data.js';
import userRoutes from '../src/routes/user.routes.js';

type QueryCall = { text: string; values?: unknown[] };
type Query = (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
type Mail = (path: string, payload: Record<string, unknown>) => Promise<unknown>;
const user = { id: 'user-id', name: 'Pessoa', email: 'pessoa@example.test', role: 'empresa' };
const recoveryMessage = 'Se o e-mail existir no sistema, as instruções serão enviadas.';
const environment = { JWT_SECRET: 'segredo-local-exclusivo-dos-testes', RESEND_API_KEY: 're_local_test', MAIL_FROM: 'Civix <noreply@example.test>', FRONTEND_URL: 'http://frontend.example.test/' };

async function withUsers(t: TestContext, query: Query, run: (url: string) => Promise<void>, mail?: Mail) {
  const previous = Object.fromEntries(Object.keys(environment).map(key => [key, process.env[key]]));
  Object.assign(process.env, environment);
  t.mock.method(console, 'error', () => {});
  t.mock.method(db, 'query', query);
  t.mock.method(Resend.prototype, 'post', mail ?? (async () => { throw new Error('Envio de e-mail não esperado neste teste'); }));
  const app = express();
  app.use(express.json());
  app.use('/api/v1/users', userRoutes);
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    await run(`http://127.0.0.1:${address.port}/api/v1/users`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

async function post(url: string, path: string, body: unknown) {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

function unreachableQuery(): Promise<{ rows: Record<string, unknown>[] }> {
  throw new Error('Consulta de persistência não esperada neste teste');
}

test('Login mantém bcrypt para empresas, acesso de clientes e JWT com validade de uma hora', async t => {
  const passwordHash = await bcrypt.hash('senha-local', 10);
  const calls: QueryCall[] = [];
  await withUsers(t, async (text, values) => {
    calls.push({ text, values });
    return { rows: [{ ...user, role: text.includes("role = 'cliente'") ? 'cliente' : 'empresa', password_hash: passwordHash }] };
  }, async url => {
    for (const role of ['empresa', 'cliente']) {
      const result = await post(url, '/login', { email: user.email, role, ...(role === 'empresa' ? { password: 'senha-local' } : {}) });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.user, { ...user, role });
      assert.equal('password_hash' in result.body.user, false);
      const payload = jwt.verify(result.body.token, environment.JWT_SECRET) as jwt.JwtPayload;
      assert.equal(payload.id, user.id);
      assert.equal(payload.email, user.email);
      assert.equal(payload.role, role);
      assert.equal(payload.exp! - payload.iat!, 3600);
      assert.deepEqual(calls.at(-1)?.values, [user.email]);
      assert.match(calls.at(-1)!.text, /FROM users/);
      assert.match(calls.at(-1)!.text, new RegExp(`role = '${role}'`));
    }
  });
});

test('Login rejeita entradas ausentes ou perfil inválido antes de consultar a persistência', async t => {
  await withUsers(t, unreachableQuery, async url => {
    for (const [body, message] of [
      [{ role: 'cliente' }, 'Email é obrigatório'],
      [{ email: user.email, role: 'outro' }, 'Tipo de usuário inválido'],
      [{ email: user.email, role: 'empresa' }, 'Senha é obrigatória para empresas'],
    ] as const) assert.deepEqual(await post(url, '/login', body), { status: 400, body: { error: message } });
  });
});

test('Login preserva erros de credenciais, ausência de hash/segredo e falha de persistência', async t => {
  const passwordHash = await bcrypt.hash('senha-correta', 10);
  let scenario = 'missing';
  await withUsers(t, async () => {
    if (scenario === 'database') throw new Error('Falha simulada na persistência');
    return { rows: scenario === 'missing' ? [] : [{ ...user, ...(scenario === 'hash' ? {} : { password_hash: passwordHash }) }] };
  }, async url => {
    for (const [nextScenario, status, message] of [
      ['missing', 401, 'Usuário não encontrado.'],
      ['password', 401, 'Senha incorreta.'],
      ['hash', 500, 'Usuário da empresa não possui senha cadastrada.'],
      ['secret', 500, 'Erro interno do servidor.'],
      ['database', 500, 'Erro interno do servidor'],
    ] as const) {
      scenario = nextScenario;
      if (scenario === 'secret') delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = environment.JWT_SECRET;
      assert.deepEqual(await post(url, '/login', { email: user.email, role: 'empresa', password: scenario === 'password' ? 'senha-errada' : 'senha-correta' }), { status, body: { error: message } });
    }
  });
});

test('Aliases de recuperação preservam validação e resposta que evita enumeração de e-mails', async t => {
  const calls: QueryCall[] = [];
  await withUsers(t, async (text, values) => { calls.push({ text, values }); return { rows: [] }; }, async url => {
    for (const path of ['/forgot-password', '/esqueci-senha']) {
      assert.deepEqual(await post(url, path, {}), { status: 400, body: { error: 'E-mail é obrigatório.' } });
      assert.deepEqual(await post(url, path, { email: user.email }), { status: 200, body: { message: recoveryMessage } });
    }
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.match(call.text, /SELECT id, name, email FROM users WHERE email = \$1/);
      assert.deepEqual(call.values, [user.email]);
    }
  });
});

test('Recuperação persiste somente hash SHA256 com expiração de uma hora antes de enviar o e-mail', async t => {
  const calls: QueryCall[] = [];
  const start = Date.now();
  let sentToken = '';
  await withUsers(t, async (text, values) => { calls.push({ text, values }); return { rows: text.includes('SELECT') ? [user] : [] }; }, async url => {
    assert.deepEqual(await post(url, '/forgot-password', { email: user.email }), { status: 200, body: { message: recoveryMessage } });
    const update = calls[1]!;
    assert.match(update.text, /SET reset_password_token = \$1, reset_password_expires = \$2/);
    assert.match(sentToken, /^[a-f0-9]{64}$/);
    assert.equal(update.values?.[0], createHash('sha256').update(sentToken).digest('hex'));
    assert.notEqual(update.values?.[0], sentToken);
    const expiresAt = update.values?.[1] as Date;
    assert.ok(expiresAt instanceof Date);
    assert.ok(expiresAt.getTime() >= start + 3600000 && expiresAt.getTime() <= Date.now() + 3600000);
    assert.equal(update.values?.[2], user.id);
  }, async (path, payload) => {
    assert.equal(path, '/emails');
    assert.equal(calls.length, 2);
    assert.deepEqual(payload.to, [user.email]);
    const resetUrl = String(payload.html).match(/href="([^"]+)"/)?.[1];
    assert.ok(resetUrl);
    const parsed = new URL(resetUrl);
    assert.equal(parsed.pathname, '/redefinir-senha');
    sentToken = parsed.searchParams.get('token')!;
    return { data: { id: 'local-mail-id' }, error: null };
  });
});

test('Recuperação mantém falhas de busca, atualização e envio sem conectar serviços externos', async t => {
  let scenario = 'lookup';
  let mailCalls = 0;
  await withUsers(t, async text => {
    if (scenario === 'lookup' || (scenario === 'update' && text.includes('UPDATE'))) throw new Error('Falha simulada na persistência');
    return { rows: text.includes('SELECT') ? [user] : [] };
  }, async url => {
    for (const nextScenario of ['lookup', 'update', 'mail']) {
      scenario = nextScenario;
      assert.deepEqual(await post(url, '/esqueci-senha', { email: user.email }), { status: 500, body: { error: 'Erro interno do servidor.' } });
    }
    assert.equal(mailCalls, 1);
  }, async () => { mailCalls++; return { data: null, error: { message: 'Falha simulada no envio' } }; });
});

test('Aliases de redefinição verificam hash do token, usam bcrypt10 e limpam os campos de recuperação', async t => {
  const calls: QueryCall[] = [];
  await withUsers(t, async (text, values) => { calls.push({ text, values }); return { rows: text.includes('SELECT') ? [{ id: user.id }] : [] }; }, async url => {
    for (const path of ['/reset-password', '/redefinir-senha']) {
      const start = calls.length;
      assert.deepEqual(await post(url, path, { token: 'token-local', password: 'nova-senha-local' }), { status: 200, body: { message: 'Senha redefinida com sucesso.' } });
      const lookup = calls[start]!;
      assert.match(lookup.text, /reset_password_expires > NOW\(\)/);
      assert.deepEqual(lookup.values, [createHash('sha256').update('token-local').digest('hex')]);
      const update = calls[start + 1]!;
      assert.match(update.text, /SET password_hash = \$1, reset_password_token = NULL, reset_password_expires = NULL/);
      assert.equal(update.values?.[1], user.id);
      const hash = update.values?.[0] as string;
      assert.equal(bcrypt.getRounds(hash), 10);
      assert.equal(await bcrypt.compare('nova-senha-local', hash), true);
    }
  });
});

test('Redefinição mantém entradas obrigatórias, senha mínima, token inválido e falhas de persistência', async t => {
  let scenario = 'invalid';
  let queries = 0;
  await withUsers(t, async text => {
    queries++;
    if (scenario === 'lookup' || (scenario === 'update' && text.includes('UPDATE'))) throw new Error('Falha simulada na persistência');
    return { rows: scenario === 'invalid' ? [] : [{ id: user.id }] };
  }, async url => {
    for (const path of ['/reset-password', '/redefinir-senha']) {
      assert.deepEqual(await post(url, path, {}), { status: 400, body: { error: 'Token e nova senha são obrigatórios.' } });
      assert.deepEqual(await post(url, path, { token: 'token-local', password: 'curta' }), { status: 400, body: { error: 'A senha deve ter no mínimo 8 caracteres.' } });
    }
    assert.equal(queries, 0);
    for (const [nextScenario, status, message] of [
      ['invalid', 400, 'Token inválido ou expirado.'],
      ['lookup', 500, 'Erro interno do servidor.'],
      ['update', 500, 'Erro interno do servidor.'],
    ] as const) {
      scenario = nextScenario;
      assert.deepEqual(await post(url, '/reset-password', { token: 'token-local', password: 'nova-senha-local' }), { status, body: { error: message } });
    }
  });
});

test('Perfil e home mantêm proteção Bearer e respostas públicas existentes', async t => {
  await withUsers(t, unreachableQuery, async url => {
    const token = jwt.sign({ id: user.id, role: user.role }, environment.JWT_SECRET, { expiresIn: '1h' });
    for (const [path, method, body] of [
      ['/profile', 'GET', { message: 'Acesso permitido à rota protegida', userId: user.id }],
      ['/home', 'POST', { message: 'Acesso permitido à rota home', userId: user.id, userRole: user.role }],
    ] as const) {
      const absent = await fetch(url + path, { method });
      assert.equal(absent.status, 401);
      assert.deepEqual(await absent.json(), { error: 'Token não fornecido.' });
      const invalid = await fetch(url + path, { method, headers: { Authorization: 'Bearer invalido' } });
      assert.equal(invalid.status, 401);
      assert.deepEqual(await invalid.json(), { error: 'Token inválido ou expirado.' });
      const success = await fetch(url + path, { method, headers: { Authorization: `Bearer ${token}` } });
      assert.equal(success.status, 200);
      assert.deepEqual(await success.json(), body);
    }
  });
});
