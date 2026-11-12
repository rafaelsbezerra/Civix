import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import test, { type TestContext } from 'node:test';
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { userRepository } from '../src/persistence/index.js';
import type { UserRepository } from '../src/repositories/user.repository.js';
import userRoutes from '../src/routes/user.routes.js';
import {
  createErrorHandler,
  createNotFoundHandler,
} from '../src/middlewares/error.handler.js';

type Mail = (path: string, payload: Record<string, unknown>) => Promise<unknown>;
const user = {
  id: 'user-id',
  name: 'Pessoa',
  email: 'pessoa@example.test',
  role: 'super_admin' as const,
  company_id: null,
  status: 'active',
  password_hash: await bcrypt.hash('senha-local', 4),
};
const recoveryMessage = 'Se o e-mail existir no sistema, as instruções serão enviadas.';
const environment = {
  JWT_SECRET: 'segredo-local-exclusivo-dos-testes',
  RESEND_API_KEY: 're_local_test',
  MAIL_FROM: 'Civix <noreply@example.test>',
  FRONTEND_URL: 'http://frontend.example.test/',
};

async function withUsers(
  t: TestContext,
  repository: Partial<UserRepository>,
  run: (url: string) => Promise<void>,
  mail?: Mail,
) {
  const previous = Object.fromEntries(
    Object.keys(environment).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, environment);
  t.mock.method(console, 'error', () => {});
  for (const method of Object.keys(userRepository) as (keyof UserRepository)[]) {
    t.mock.method(userRepository, method, repository[method] ?? unreachableQuery);
  }
  t.mock.method(
    Resend.prototype,
    'post',
    mail ??
      (async () => {
        throw new Error('Envio de e-mail não esperado neste teste');
      }),
  );
  const app = express();
  app.use(express.json());
  app.use('/api/v1/users', userRoutes);
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ environment: 'production' }));
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    await run(`http://127.0.0.1:${address.port}/api/v1/users`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

async function post(url: string, path: string, body: unknown) {
  const response = await fetch(url + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = { status: response.status, body: await response.json() };
  const cookie = response.headers.get('set-cookie');
  return cookie ? { ...result, cookie } : result;
}

function unreachableQuery(): never {
  throw new Error('Consulta de persistência não esperada neste teste');
}

test('Login exige senha para perfis operacionais e não autentica cliente', async (t) => {
  await withUsers(
    t,
    { getForLogin: async () => user, getById: async () => user },
    async (url) => {
      const success = await post(url, '/login', {
        email: user.email.toUpperCase(),
        password: 'senha-local',
      });
      assert.equal(success.status, 200);
      assert.equal(success.body.data.user.role, 'super_admin');
      assert.equal(success.body.data.user.companyId, null);
      assert.equal(success.body.data.user.password_hash, undefined);
      assert.ok('cookie' in success);
      assert.match(success.cookie, /; HttpOnly(?:;|$)/i);
      const token = success.cookie.match(/^sessao=([^;]+)/)?.[1];
      assert.ok(token);
      assert.equal(success.body.data.token, undefined);
      const claims = jwt.verify(token, environment.JWT_SECRET) as jwt.JwtPayload;
      assert.equal(claims.tokenVersion, 2);
      assert.equal(claims.exp! - claims.iat!, 3600);
      assert.equal(
        (await post(url, '/login', { email: user.email, password: 'senha-errada' }))
          .status,
        401,
      );
      assert.equal(
        (
          await post(url, '/login', {
            email: user.email,
            password: 'senha-local',
            role: 'atendente',
          })
        ).status,
        401,
      );
      assert.equal(
        (await post(url, '/login', { email: user.email, role: 'cliente' })).status,
        403,
      );
    },
  );
});

test('Login valida entradas antes da persistência e preserva falha interna', async (t) => {
  await withUsers(t, {}, async (url) => {
    for (const body of [
      {},
      { email: user.email },
      { email: user.email, password: 'senha-local', role: 'root' },
    ]) {
      assert.equal((await post(url, '/login', body)).status, 400);
    }
    assert.equal(
      (await post(url, '/login', { email: user.email, password: 'senha-local' }))
        .status,
      500,
    );
  });
});

test('Aliases de recuperação preservam validação e resposta que evita enumeração de e-mails', async (t) => {
  const calls: unknown[][] = [];
  await withUsers(
    t,
    {
      async getByEmail(email) {
        calls.push([email]);
        return undefined;
      },
    },
    async (url) => {
      for (const path of ['/forgot-password', '/esqueci-senha']) {
        assert.deepEqual(await post(url, path, {}), {
          status: 400,
          body: { status: 400, message: 'E-mail é obrigatório.' },
        });
        assert.deepEqual(await post(url, path, { email: user.email }), {
          status: 200,
          body: { data: { message: recoveryMessage } },
        });
      }
      assert.deepEqual(calls, [[user.email], [user.email]]);
    },
  );
});

test('Recuperação persiste somente hash SHA256 com expiração de uma hora antes de enviar o e-mail', async (t) => {
  const calls: unknown[][] = [];
  const start = Date.now();
  let sentToken = '';
  await withUsers(
    t,
    {
      async getByEmail(email) {
        calls.push([email]);
        return user;
      },
      async savePasswordResetToken(...args) {
        calls.push(args);
      },
    },
    async (url) => {
      assert.deepEqual(await post(url, '/forgot-password', { email: user.email }), {
        status: 200,
        body: { data: { message: recoveryMessage } },
      });
      const [id, tokenHash, expiration] = calls[1]!;
      assert.match(sentToken, /^[a-f0-9]{64}$/);
      assert.equal(tokenHash, createHash('sha256').update(sentToken).digest('hex'));
      assert.notEqual(tokenHash, sentToken);
      const expiresAt = expiration;
      assert.ok(expiresAt instanceof Date);
      assert.ok(
        expiresAt.getTime() >= start + 3600000 &&
          expiresAt.getTime() <= Date.now() + 3600000,
      );
      assert.equal(id, user.id);
    },
    async (path, payload) => {
      assert.equal(path, '/emails');
      assert.equal(calls.length, 2);
      assert.deepEqual(payload.to, [user.email]);
      const resetUrl = String(payload.html).match(/href="([^"]+)"/)?.[1];
      assert.ok(resetUrl);
      const parsed = new URL(resetUrl);
      assert.equal(parsed.pathname, '/redefinir-senha');
      sentToken = parsed.searchParams.get('token')!;
      return { data: { id: 'local-mail-id' }, error: null };
    },
  );
});

test('Recuperação mantém falhas de busca, atualização e envio sem conectar serviços externos', async (t) => {
  let scenario = 'lookup';
  let mailCalls = 0;
  await withUsers(
    t,
    {
      async getByEmail() {
        if (scenario === 'lookup') {
          throw new Error('Falha simulada na busca');
        }
        return user;
      },
      async savePasswordResetToken() {
        if (scenario === 'update') {
          throw new Error('Falha simulada na persistência');
        }
      },
    },
    async (url) => {
      for (const nextScenario of ['lookup', 'update', 'mail']) {
        scenario = nextScenario;
        assert.deepEqual(await post(url, '/esqueci-senha', { email: user.email }), {
          status: 500,
          body: { status: 500, message: 'Erro interno do servidor' },
        });
      }
      assert.equal(mailCalls, 1);
    },
    async () => {
      mailCalls++;
      return { data: null, error: { message: 'Falha simulada no envio' } };
    },
  );
});

test('Aliases de redefinição verificam hash do token, usam bcrypt10 e limpam os campos de recuperação', async (t) => {
  const calls: unknown[][] = [];
  await withUsers(
    t,
    {
      async getByValidResetTokenHash(...args) {
        calls.push(args);
        return { id: user.id };
      },
      async updatePasswordAndClearResetToken(...args) {
        calls.push(args);
      },
    },
    async (url) => {
      for (const path of ['/reset-password', '/redefinir-senha']) {
        const start = calls.length;
        assert.deepEqual(
          await post(url, path, { token: 'token-local', password: 'nova-senha-local' }),
          { status: 200, body: { data: { message: 'Senha redefinida com sucesso.' } } },
        );
        assert.deepEqual(calls[start], [
          createHash('sha256').update('token-local').digest('hex'),
        ]);
        const [id, passwordHash] = calls[start + 1]!;
        assert.equal(id, user.id);
        const hash = passwordHash as string;
        assert.equal(bcrypt.getRounds(hash), 10);
        assert.equal(await bcrypt.compare('nova-senha-local', hash), true);
      }
    },
  );
});

test('Redefinição mantém entradas obrigatórias, senha mínima, token inválido e falhas de persistência', async (t) => {
  let scenario = 'invalid';
  let queries = 0;
  await withUsers(
    t,
    {
      async getByValidResetTokenHash() {
        queries++;
        if (scenario === 'lookup') {
          throw new Error('Falha simulada na busca');
        }
        return scenario === 'invalid' ? undefined : { id: user.id };
      },
      async updatePasswordAndClearResetToken() {
        queries++;
        if (scenario === 'update') {
          throw new Error('Falha simulada na persistência');
        }
      },
    },
    async (url) => {
      for (const path of ['/reset-password', '/redefinir-senha']) {
        assert.deepEqual(await post(url, path, {}), {
          status: 400,
          body: { status: 400, message: 'Token e nova senha são obrigatórios.' },
        });
        assert.deepEqual(
          await post(url, path, { token: 'token-local', password: 'curta' }),
          {
            status: 400,
            body: { status: 400, message: 'A senha deve ter no mínimo 8 caracteres.' },
          },
        );
      }
      assert.equal(queries, 0);
      for (const [nextScenario, status, message] of [
        ['invalid', 400, 'Token inválido ou expirado.'],
        ['lookup', 500, 'Erro interno do servidor'],
        ['update', 500, 'Erro interno do servidor'],
      ] as const) {
        scenario = nextScenario;
        assert.deepEqual(
          await post(url, '/reset-password', {
            token: 'token-local',
            password: 'nova-senha-local',
          }),
          { status, body: { status, message } },
        );
      }
    },
  );
});

test('Perfil e home exigem sessão vigente e retornam identidade e permissões', async (t) => {
  await withUsers(t, { getById: async () => user }, async (url) => {
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: null,
        tokenVersion: 2,
      },
      environment.JWT_SECRET,
      { expiresIn: '1h' },
    );
    for (const [path, method] of [
      ['/profile', 'GET'],
      ['/home', 'POST'],
    ]) {
      assert.equal((await fetch(url + path, { method })).status, 401);
      assert.equal(
        (
          await fetch(url + path, {
            method,
            headers: { Authorization: 'Bearer invalido' },
          })
        ).status,
        401,
      );
      const success = await fetch(url + path, {
        method,
        headers: { Authorization: 'Bearer ' + token },
      });
      assert.equal(success.status, 200);
      const body = await success.json();
      if (path === '/profile') {
        assert.equal(body.data.user.id, user.id);
        assert.equal(body.data.user.role, user.role);
        assert.ok(body.data.permissions);
      } else {
        assert.equal(body.data.userId, user.id);
        assert.equal(body.data.userRole, user.role);
      }
    }
  });
});
