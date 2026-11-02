import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const temporaryRoot = await mkdtemp(join(tmpdir(), 'civix-users-roles-'));
const jwtSecret = 'segredo-isolado-dos-testes-de-papeis';
Object.assign(process.env, {
  USE_MOCK_DATA: 'true', MOCK_DATA_DIR: temporaryRoot, JWT_SECRET: jwtSecret,
  JWT_INVITE_SECRET: 'convite-isolado-dos-testes-de-papeis',
  DATABASE_URL: 'postgresql://teste:teste@127.0.0.1:1/teste',
  RESEND_API_KEY: '', MAIL_FROM: '', NODE_ENV: 'production',
});

const store = await import('../src/persistence/json/local.store.js');
const { db } = await import('../src/shared/config/data.js');
const { app } = await import('../src/app.js');
const password = 'senha-isolada-123';
const passwordHash = await bcrypt.hash(password, 4);
const companyA = '10000000-0000-4000-8000-000000000001';
const companyB = '10000000-0000-4000-8000-000000000002';
const userId = '20000000-0000-4000-8000-000000000001';
type OperationalRole = 'admin_empresa' | 'super_admin' | 'atendente';

function company(id: string) {
  return {
    id, nome: 'Empresa de teste', cnpj: id, descricao: '', descricao_detalhada: '',
    categoria: 'Tecnologia', cidade: 'Fortaleza', estado: 'CE', status: 'ativo',
    verificado: false, tamanho: 'pequena',
  };
}

function user(role: OperationalRole | 'cliente' = 'admin_empresa') {
  return {
    id: userId, email: 'pessoa@example.test', name: 'Pessoa de teste', role,
    password_hash: passwordHash, status: 'active', invite_token: null,
    company_id: role === 'admin_empresa' || role === 'atendente' ? companyA : null,
  };
}

async function seed(users: object[] = [user()]) {
  await writeFile(store.LOCAL_DATA_FILE, JSON.stringify({
    version: 1, companies: [company(companyA), company(companyB)], users, plans: [], outbox: [],
  }), 'utf8');
}

test('Papéis e sessão consultam identidade persistida sem banco externo', async t => {
  t.mock.method(db, 'query', () => { throw new Error('PostgreSQL não pode ser acessado neste teste.'); });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1/users`;

  async function login(input: object) {
    const response = await fetch(`${baseUrl}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
    });
    return { status: response.status, body: await response.json() };
  }

  async function profile(token?: string) {
    const response = await fetch(`${baseUrl}/profile`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return { status: response.status, body: await response.json() };
  }

  try {
    for (const role of ['admin_empresa', 'super_admin', 'atendente'] as const) {
      await t.test(`Login ${role} verifica senha e resolve perfil público`, async () => {
        const account = user(role);
        await seed([account]);
        const result = await login({ email: account.email.toUpperCase(), password });
        assert.equal(result.status, 200);
        assert.equal(result.body.data.user.role, role);
        assert.equal(result.body.data.user.companyId, account.company_id);
        assert.equal(result.body.data.user.password_hash, undefined);
        const claims = jwt.verify(result.body.data.token, jwtSecret) as jwt.JwtPayload;
        assert.equal(claims.role, role);
        assert.equal(claims.companyId, account.company_id);
        assert.equal(claims.tokenVersion, 2);
        const current = await profile(result.body.data.token);
        assert.equal(current.status, 200);
        assert.equal(current.body.data.user.id, account.id);
        assert.equal(current.body.data.user.role, role);
        assert.equal(current.body.data.user.companyId, account.company_id);
        assert.ok(current.body.data.permissions);
        const wrongPassword = await login({ email: account.email, password: 'senha-incorreta-123' });
        assert.equal(wrongPassword.status, 401);
        assert.equal(wrongPassword.body.data?.token, undefined);
      });
    }

    await t.test('Cliente não recebe token nem com senha correta', async () => {
      await seed([user('cliente')]);
      const result = await login({ email: 'pessoa@example.test', password, role: 'cliente' });
      assert.equal(result.status, 403);
      assert.equal(result.body.data?.token, undefined);
    });

    await t.test('Papel declarado não promove a conta nem aceita valores desconhecidos', async () => {
      await seed();
      const elevated = await login({ email: 'pessoa@example.test', password, role: 'super_admin' });
      assert.equal(elevated.status, 401);
      assert.equal(elevated.body.data?.token, undefined);
      const unknown = await login({ email: 'pessoa@example.test', password, role: 'root' });
      assert.equal(unknown.status, 400);
    });

    await t.test('Token legado e ausência de autenticação não abrem perfil', async () => {
      await seed();
      const legacy = jwt.sign({ id: userId, email: 'pessoa@example.test', role: 'empresa' }, jwtSecret);
      assert.equal((await profile(legacy)).status, 401);
      assert.equal((await profile()).status, 401);
    });

    for (const change of ['role', 'company', 'status', 'removed'] as const) {
      await t.test(`Sessão deixa de autorizar após alteração de ${change}`, async () => {
        await seed();
        const result = await login({ email: 'pessoa@example.test', password });
        assert.equal(result.status, 200);
        const account = user();
        const changed = change === 'role' ? { ...account, role: 'atendente' }
          : change === 'company' ? { ...account, company_id: companyB }
          : { ...account, status: 'blocked' };
        await seed(change === 'removed' ? [] : [changed]);
        assert.equal((await profile(result.body.data.token)).status, 401);
      });
    }

    await t.test('Perfil operacional não autentica sem hash, senha ou vínculo', async () => {
      const { password_hash: _hash, ...withoutHash } = user();
      await seed([withoutHash]);
      assert.equal((await login({ email: 'pessoa@example.test', password })).status, 401);
      await seed();
      const withoutPassword = await login({ email: 'pessoa@example.test' });
      assert.ok([400, 401].includes(withoutPassword.status));
      assert.equal(withoutPassword.body.data?.token, undefined);
      await seed([{ ...user(), company_id: null }]);
      const withoutCompany = await login({ email: 'pessoa@example.test', password });
      assert.equal(withoutCompany.status, 500);
      const preserved = JSON.parse(await readFile(store.LOCAL_DATA_FILE, 'utf8'));
      assert.equal(preserved.users[0].company_id, null);
      assert.equal(withoutCompany.body.data?.token, undefined);
    });

    await t.test('Contexto de acesso rejeita usuário persistido sem vínculo mesmo com senha', async context => {
      await seed();
      const { userRepository } = await import('../src/persistence/user.repository.js');
      const { getAuthenticatedUser } = await import('../src/services/user.access.service.js');
      context.mock.method(userRepository, 'getById', async () => ({ ...user(), company_id: null }));
      await assert.rejects(getAuthenticatedUser(userId), { status: 401 });
    });

    for (const status of ['pending', 'inactive', 'disabled', 'blocked']) {
      await t.test(`Conta ${status} não autentica`, async () => {
        await seed([{ ...user(), status }]);
        const result = await login({ email: 'pessoa@example.test', password });
        assert.equal(result.status, 401);
        assert.equal(result.body.data?.token, undefined);
      });
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
