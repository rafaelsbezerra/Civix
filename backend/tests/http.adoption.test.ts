import assert from 'node:assert/strict';
import { once } from 'node:events';
import test, { type TestContext } from 'node:test';
import bcrypt from 'bcrypt';
import express, { type Express } from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Company } from '../src/entities/company.entity.js';
import type { UserRole } from '../src/entities/user.entity.js';
import { authRepository } from '../src/persistence/index.js';
import { companyRepository } from '../src/persistence/index.js';
import { planRepository } from '../src/persistence/index.js';
import { userRepository } from '../src/persistence/index.js';
import { AppError } from '../src/shared/errors/app.error.js';
import { ErrorCode } from '../src/shared/errors/error.code.js';
import {
  createErrorHandler,
  createNotFoundHandler,
} from '../src/middlewares/error.handler.js';
import authRoutes from '../src/routes/auth.routes.js';
import planRoutes from '../src/routes/plan.routes.js';
import * as adminService from '../src/services/admin.service.js';

const environment = {
  JWT_SECRET: 'segredo-local-teste',
  JWT_INVITE_SECRET: 'convite-local-teste',
  JWT_RESET_SECRET: 'reset-local-teste',
  RESEND_API_KEY: 're_local_test',
  MAIL_FROM: 'Civix <noreply@example.test>',
  FRONTEND_URL: 'http://frontend.example.test',
};
const planRow = {
  id: 1,
  name: 'Plano Inicial',
  slug: 'inicial',
  description: 'Plano de teste',
  price: '19.90',
  billing_period: 'monthly' as const,
  features: ['Catálogo', 4],
  limits: { members: 3, discarded: null },
  is_featured: false,
  is_active: true,
  display_order: 1,
};
const plan = {
  id: '1',
  name: 'Plano Inicial',
  slug: 'inicial',
  description: 'Plano de teste',
  price: '19.90',
  billingPeriod: 'monthly',
  features: ['Catálogo'],
  limits: { members: 3 },
  isFeatured: false,
  isActive: true,
  displayOrder: 1,
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
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

async function withRoutes(
  t: TestContext,
  run: (url: string) => Promise<void>,
  mail?: (path: string, payload: Record<string, unknown>) => Promise<unknown>,
) {
  const previous = Object.fromEntries(
    Object.keys(environment).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, environment);
  t.mock.method(PrismaPg.prototype, 'connect', unreachableQuery);
  t.mock.method(
    Resend.prototype,
    'post',
    mail ??
      (async () => {
        throw new Error('Envio externo não esperado');
      }),
  );
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
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

async function request(url: string, path: string, body?: unknown, role?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (role) {
    headers.Authorization = `Bearer ${jwt.sign({ id: 'user-id', email: 'pessoa@example.test', role, companyId: companyId, tokenVersion: 2 }, environment.JWT_SECRET)}`;
  }
  const response = await fetch(url + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

function unreachableQuery(): never {
  throw new Error('Consulta de persistência não esperada');
}

const companyId = '10000000-0000-4000-8000-000000000001';
const account = {
  id: 'user-id',
  email: 'pessoa@example.test',
  role: 'admin_empresa' as const,
  company_id: companyId,
  status: 'active',
  password_hash: 'hash-apenas-contexto',
};
const activeCompany = { id: companyId, status: 'ativo' } as Company;

function invite() {
  return jwt.sign(
    { email: account.email, role: account.role, companyId, purpose: 'invite' },
    environment.JWT_INVITE_SECRET,
  );
}

test('Convite valida propósito, empresa, estado e token antes da ativação bcrypt', async (t) => {
  const token = invite();
  let scenario = 'valid';
  const lookups: Parameters<typeof authRepository.getInviteUserByEmail>[] = [];
  const activations: Parameters<typeof authRepository.activateUser>[] = [];
  t.mock.method(companyRepository, 'getById', async () => activeCompany);
  t.mock.method(
    authRepository,
    'getInviteUserByEmail',
    async (...args: Parameters<typeof authRepository.getInviteUserByEmail>) => {
      lookups.push(args);
      if (scenario === 'database') {
        throw new Error('Falha de persistência confidencial');
      }
      if (scenario === 'missing') {
        return undefined;
      }
      return {
        ...account,
        status: scenario === 'active' ? 'active' : 'pending',
        invite_token: scenario === 'used' ? 'outro' : token,
      };
    },
  );
  t.mock.method(
    authRepository,
    'activateUser',
    async (...args: Parameters<typeof authRepository.activateUser>) => {
      activations.push(args);
      return scenario !== 'race';
    },
  );
  await withRoutes(t, async (url) => {
    assert.equal((await request(url, '/api/v1/auth/validate-token')).status, 400);
    const path = '/api/v1/auth/validate-token?token=' + encodeURIComponent(token);
    assert.deepEqual(await request(url, path), {
      status: 200,
      body: { data: { email: account.email } },
    });
    assert.deepEqual(lookups, [[account.email, account.role]]);
    for (const [next, status] of [
      ['active', 400],
      ['used', 401],
      ['missing', 404],
      ['database', 500],
    ] as const) {
      scenario = next;
      assert.equal((await request(url, path)).status, status);
    }
    scenario = 'valid';
    const activated = await request(url, '/api/v1/auth/first-access', {
      token,
      password: 'senha-local',
    });
    assert.equal(activated.status, 200);
    assert.ok(activated.body.data.message);
    const [id, hash, inviteToken] = activations[0]!;
    assert.equal(id, account.id);
    assert.equal(inviteToken, token);
    assert.equal(bcrypt.getRounds(hash), 10);
    assert.equal(await bcrypt.compare('senha-local', hash), true);
    scenario = 'race';
    assert.equal(
      (
        await request(url, '/api/v1/auth/first-access', {
          token,
          password: 'senha-local',
        })
      ).status,
      401,
    );
  });
});

test('Convites inválidos, expirados, legados ou sem propósito não consultam persistência', async (t) => {
  const lookup = t.mock.method(
    authRepository,
    'getInviteUserByEmail',
    unreachableQuery,
  );
  await withRoutes(t, async (url) => {
    const tokens = [
      'invalido',
      jwt.sign(
        { email: account.email, role: 'empresa' },
        environment.JWT_INVITE_SECRET,
      ),
      jwt.sign(
        { email: account.email, role: account.role, companyId, purpose: 'invite' },
        environment.JWT_INVITE_SECRET,
        { expiresIn: -1 },
      ),
      jwt.sign(
        { email: account.email, role: account.role, companyId, purpose: 'reset' },
        environment.JWT_INVITE_SECRET,
      ),
    ];
    for (const token of tokens) {
      assert.equal(
        (
          await request(
            url,
            '/api/v1/auth/validate-token?token=' + encodeURIComponent(token),
          )
        ).status,
        401,
      );
    }
    assert.equal((await request(url, '/api/v1/auth/first-access', {})).status, 400);
    assert.equal(
      (
        await request(url, '/api/v1/auth/first-access', {
          token: 'invalido',
          password: 'curta',
        })
      ).status,
      400,
    );
    assert.equal(lookup.mock.callCount(), 0);
  });
});

test('Reconvite preserva perfil e vínculo e detecta atualização concorrente', async (t) => {
  let status = 'pending';
  let concurrentChange = false;
  let mailCalls = 0;
  const invitations: Parameters<typeof authRepository.saveInvite>[] = [];
  t.mock.method(companyRepository, 'getById', async () => activeCompany);
  t.mock.method(authRepository, 'getInviteUserByEmail', async () => ({
    ...account,
    status,
    invite_token: 'anterior',
  }));
  t.mock.method(
    authRepository,
    'saveInvite',
    async (...args: Parameters<typeof authRepository.saveInvite>) => {
      invitations.push(args);
      if (concurrentChange) {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Alteração concorrente',
        });
      }
    },
  );
  await withRoutes(
    t,
    async () => {
      await adminService.inviteUser(account.email, 'admin_empresa', companyId);
      assert.equal(mailCalls, 1);
      const [email, role, token, id, linkedCompany] = invitations[0]!;
      assert.equal(email, account.email);
      assert.equal(role, account.role);
      assert.ok(token);
      assert.equal(id, account.id);
      assert.equal(linkedCompany, companyId);
      concurrentChange = true;
      await assert.rejects(
        adminService.inviteUser(account.email, 'admin_empresa', companyId),
        { status: 409 },
      );
      status = 'active';
      await assert.rejects(
        adminService.inviteUser(account.email, 'admin_empresa', companyId),
        { status: 409 },
      );
      await assert.rejects(
        adminService.inviteUser(account.email, 'atendente', companyId),
        { status: 409 },
      );
      assert.equal(mailCalls, 1);
    },
    async () => {
      mailCalls++;
      return { data: { id: 'mail-local' }, error: null };
    },
  );
});

test('Planos preservam envelope, autorização e parâmetros do usuário vigente', async (t) => {
  let role: UserRole = 'admin_empresa';
  let failure = false;
  let missing = false;
  const assignments: Parameters<typeof userRepository.assignPlan>[] = [];
  t.mock.method(userRepository, 'getById', async () => ({ ...account, role }));
  t.mock.method(companyRepository, 'getById', async () => activeCompany);
  t.mock.method(planRepository, 'getActive', async () => {
    if (failure) {
      throw new Error('Falha de persistência confidencial');
    }
    return [planRow];
  });
  t.mock.method(planRepository, 'getActiveById', async (id: string) =>
    missing || id !== String(planRow.id) ? undefined : planRow,
  );
  t.mock.method(
    userRepository,
    'assignPlan',
    async (...args: Parameters<typeof userRepository.assignPlan>) => {
      assignments.push(args);
      return true;
    },
  );
  await withRoutes(t, async (url) => {
    assert.deepEqual(await request(url, '/api/v1/plans'), {
      status: 200,
      body: { data: [plan] },
    });
    assert.deepEqual(
      await request(url, '/api/v1/plans/selection', { planId: '1' }, role),
      { status: 200, body: { data: plan } },
    );
    assert.deepEqual(assignments, [[account.id, planRow.id]]);
    assert.equal((await request(url, '/api/v1/plans/selection', {}, role)).status, 400);
    role = 'atendente';
    assert.equal(
      (await request(url, '/api/v1/plans/selection', { planId: '1' }, role)).status,
      403,
    );
    role = 'admin_empresa';
    missing = true;
    assert.equal(
      (await request(url, '/api/v1/plans/selection', { planId: '1' }, role)).status,
      400,
    );
    failure = true;
    assert.equal((await request(url, '/api/v1/plans')).status, 500);
  });
});

test('Reenvio de convite mantém resposta antienumeração, token persistido e envio isolado', async (t) => {
  const invitations: Parameters<typeof authRepository.saveInvite>[] = [];
  let found = false;
  let mailCalls = 0;
  const message =
    'Se o e-mail estiver cadastrado, um link de redefinição será enviado.';
  const lookup = async () =>
    found ? { ...account, status: 'pending', invite_token: 'anterior' } : undefined;
  t.mock.method(companyRepository, 'getById', async () => activeCompany);
  t.mock.method(authRepository, 'getResetUserByEmail', lookup);
  t.mock.method(authRepository, 'getInviteUserByEmail', lookup);
  t.mock.method(
    authRepository,
    'saveInvite',
    async (...args: Parameters<typeof authRepository.saveInvite>) => {
      invitations.push(args);
    },
  );
  await withRoutes(
    t,
    async (url) => {
      assert.deepEqual(await request(url, '/api/v1/auth/resend-invite-email', {}), {
        status: 400,
        body: { status: 400, message: 'Email é obrigatório.' },
      });
      for (const nextFound of [false, true]) {
        found = nextFound;
        assert.deepEqual(
          await request(url, '/api/v1/auth/resend-invite-email', {
            email: 'pessoa@example.test',
          }),
          { status: 200, body: { data: { message } } },
        );
      }
      assert.equal(mailCalls, 1);
      assert.equal(invitations.length, 1);
      const payload = jwt.verify(
        invitations[0]![2],
        environment.JWT_INVITE_SECRET,
      ) as jwt.JwtPayload;
      assert.equal(payload.role, 'admin_empresa');
      assert.equal(payload.companyId, companyId);
      assert.equal(payload.purpose, 'invite');
      assert.equal(payload.exp! - payload.iat!, 86400);
    },
    async (path, payload) => {
      mailCalls++;
      assert.equal(path, '/emails');
      assert.equal(invitations.length, 1);
      assert.deepEqual(payload.to, ['pessoa@example.test']);
      return { data: { id: 'mail-local' }, error: null };
    },
  );
});

test('Handler de staging preserva causa e pilha sanitizadas sem expor senhas, tokens ou URL de banco', async () => {
  const app = express();
  app.get('/failure', () => {
    throw new AppError({
      status: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Erro interno do servidor',
      cause: new Error(
        'postgresql://user:credencialConfidencial@localhost/database token=tokenConfidencial',
      ),
      details: { password: 'senhaConfidencial', field: 'email' },
    });
  });
  app.use(createErrorHandler({ environment: 'staging' }));
  await withServer(app, async (url) => {
    const response = await fetch(url + '/failure');
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.code, ErrorCode.INTERNAL_ERROR);
    assert.match(body.stack, /AppError/);
    assert.ok(body.details.cause.stack);
    const serialized = JSON.stringify(body);
    assert.ok(serialized.includes('[REMOVIDO]'));
    assert.ok(serialized.includes('email'));
    for (const secret of [
      'credencialConfidencial',
      'tokenConfidencial',
      'senhaConfidencial',
    ]) {
      assert.ok(!serialized.includes(secret));
    }
  });
});

test('Bootstrap real aplica contratos ao root, JSON inválido, corpo excessivo e 404 global', async (t) => {
  t.mock.method(PrismaPg.prototype, 'connect', unreachableQuery);
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const { app } = await import('../src/app.js');
    await withServer(app, async (url) => {
      const root = await fetch(url);
      assert.equal(root.status, 200);
      const body = await root.json();
      assert.deepEqual(Object.keys(body), ['data']);
      const missing = await fetch(url + '/rota-inexistente');
      assert.equal(missing.status, 404);
      assert.deepEqual(await missing.json(), {
        status: 404,
        message: 'Recurso não encontrado',
      });
      const malformed = await fetch(url + '/api/v1/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      });
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
    if (previous === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previous;
    }
  }
});
