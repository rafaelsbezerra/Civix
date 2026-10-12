import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import test from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

const temporaryRoot = await mkdtemp(join(tmpdir(), 'civix-local-persistence-'));

Object.assign(process.env, {
  USE_MOCK_DATA: 'true',
  MOCK_DATA_DIR: temporaryRoot,
  JWT_SECRET: 'segredo-apenas-dos-testes-locais',
  JWT_INVITE_SECRET: 'convite-apenas-dos-testes-locais',
  FRONTEND_URL: 'http://frontend.example.test',
  DATABASE_URL: 'postgresql://teste:teste@127.0.0.1:1/teste',
  RESEND_API_KEY: '',
  MAIL_FROM: '',
});

const store = await import('../src/persistence/json/local.store.js');
const { emptyLocalData } = await import('../src/persistence/json/local.data.js');
const { createMockUser } = await import('../src/services/mock.user.service.js');
const userService = await import('../src/services/user.service.js');
const adminService = await import('../src/services/admin.service.js');
const authService = await import('../src/services/auth.service.js');
const planService = await import('../src/services/plan.service.js');
const { authRepository } = await import('../src/persistence/auth.repository.js');
const mailService = await import('../src/services/mail.service.js');
const { db } = await import('../src/shared/config/data.js');
const { app } = await import('../src/app.js');

async function resetData() {
  await writeFile(store.LOCAL_DATA_FILE, JSON.stringify(emptyLocalData()), 'utf8');
}

function runChild(source: string, flag = 'true') {
  return spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', source], {
    cwd: process.cwd(),
    env: { ...process.env, USE_MOCK_DATA: flag, MOCK_DATA_DIR: temporaryRoot },
    encoding: 'utf8',
    timeout: 20000,
  });
}

async function withServer(run: (url: string) => Promise<void>) {
  const server = app.listen(0, '127.0.0.1');

  try {
    await once(server, 'listening');

    const address = server.address();

    assert.ok(address && typeof address !== 'string');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
}

test('Persistência local funciona sem banco ou envio externo', async t => {
  const query = t.mock.method(db, 'query', () => {
    throw new Error('O teste não permite conexão com PostgreSQL.');
  });
  const sendMail = t.mock.method(Resend.prototype, 'post', async () => {
    throw new Error('O teste não permite envio de e-mail externo.');
  });
  t.mock.method(console, 'error', () => {});

  try {
    await t.test('Cria usuário com senha protegida, permite login e mantém dados em outro processo', async () => {
      await resetData();

      const user = await createMockUser({
        email: 'empresa@example.test',
        role: 'empresa',
        password: 'senha-local-123',
      });
      const stored = (await store.readLocalData()).users[0];

      assert.equal(stored.id, user.id);
      assert.notEqual(stored.password_hash, 'senha-local-123');
      assert.ok(await bcrypt.compare('senha-local-123', stored.password_hash!));

      const result = await userService.login({
        email: user.email,
        role: 'empresa',
        password: 'senha-local-123',
      });
      const payload = jwt.verify(result.token, process.env.JWT_SECRET!) as jwt.JwtPayload;

      assert.equal(payload.id, user.id);
      assert.equal(payload.role, 'empresa');
      assert.equal('password_hash' in result.user, false);
      await assert.rejects(createMockUser({
        email: user.email,
        role: 'empresa',
        password: 'outra-senha-123',
      }), { status: 409 });

      const restarted = runChild(`
        const { readLocalData } = await import('./src/persistence/json/local.store.ts');
        console.log(JSON.stringify((await readLocalData()).users.map(user => user.email)));
      `);

      assert.equal(restarted.status, 0, restarted.stderr);
      assert.match(restarted.stdout, /empresa@example.test/);
    });

    await t.test('Recuperação registra e-mail, valida expiração e consome token uma única vez', async () => {
      await resetData();
      await createMockUser({ email: 'reset@example.test', role: 'empresa', password: 'senha-antiga-123' });
      await userService.forgotPassword('inexistente@example.test');

      assert.equal((await store.readLocalData()).outbox.length, 0);
      await userService.forgotPassword('reset@example.test');

      const pending = await store.readLocalData();
      const token = new URL(pending.outbox[0].url).searchParams.get('token')!;

      assert.equal(pending.outbox[0].kind, 'password-reset');
      assert.notEqual(pending.users[0].reset_password_token, token);
      assert.ok(new Date(pending.users[0].reset_password_expires!).getTime() > Date.now());

      await store.updateLocalData(data => {
        data.users[0].reset_password_expires = new Date(Date.now() - 1000).toISOString();
      });
      await assert.rejects(userService.resetPassword({ token, password: 'senha-nova-123' }), { status: 400 });
      await store.updateLocalData(data => {
        data.users[0].reset_password_expires = new Date(Date.now() + 60000).toISOString();
      });
      await userService.resetPassword({ token, password: 'senha-nova-123' });

      const finished = (await store.readLocalData()).users[0];

      assert.ok(await bcrypt.compare('senha-nova-123', finished.password_hash!));
      assert.equal(finished.reset_password_token, null);
      assert.equal(finished.reset_password_expires, null);
      await assert.rejects(userService.resetPassword({ token, password: 'senha-outra-123' }), { status: 400 });
    });

    await t.test('Seleciona somente plano ativo e persiste o vínculo do usuário', async () => {
      await resetData();

      const user = await createMockUser({ email: 'plano@example.test', role: 'cliente' });

      await store.updateLocalData(data => {
        const plan = {
          id: 'active', name: 'Inicial', slug: 'inicial', description: 'Plano de teste',
          price: '20', billing_period: 'monthly' as const, features: ['Catálogo'], limits: {},
          is_featured: false, is_active: true, display_order: 1,
        };

        data.plans.push(plan, { ...plan, id: 'inactive', is_active: false });
      });

      assert.equal((await planService.listActivePlans()).length, 1);
      assert.equal(await planService.assignPlanToUser(user.id, 'inactive'), null);
      assert.equal(await planService.assignPlanToUser('inexistente', 'active'), null);
      assert.equal((await planService.assignPlanToUser(user.id, 'active'))?.id, 'active');
      assert.equal((await store.readLocalData()).users[0].plan_id, 'active');
    });

    await t.test('Primeiro acesso ativa a coleção legada sem alterar usuários e salva convite na caixa local', async () => {
      await resetData();
      await createMockUser({ email: 'convite@example.test', role: 'cliente' });

      const token = jwt.sign({ email: 'convite@example.test', role: 'empresa' }, process.env.JWT_INVITE_SECRET!);

      await authRepository.saveInvite('convite@example.test', 'empresa', token, false);
      await mailService.sendInviteEmail({ email: 'convite@example.test', role: 'empresa', token });
      await withServer(async url => {
        const response = await fetch(url + '/api/auth/first-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: 'senha-convite-123' }),
        });

        assert.equal(response.status, 200);
        assert.match((await response.json()).data.message, /sucesso/);
      });

      const data = await store.readLocalData();

      assert.equal(data.legacyUsers[0].status, 'active');
      assert.equal(data.legacyUsers[0].invite_token, null);
      assert.ok(await bcrypt.compare('senha-convite-123', data.legacyUsers[0].password_hash!));
      assert.equal(data.users[0].password_hash, undefined);
      assert.equal(data.outbox[0].kind, 'invite');
    });

    await t.test('Convite administrativo local permite ativação e preserva conta ativa sem expor rota admin', async () => {
      await resetData();
      await adminService.inviteUser('admin-convite@example.test', 'empresa');

      const pending = await store.readLocalData();
      const token = new URL(pending.outbox[0].url).searchParams.get('token')!;

      assert.equal(pending.users.length, 0);
      assert.equal(pending.legacyUsers.length, 1);
      assert.equal(pending.legacyUsers[0].status, 'pending');
      assert.equal(pending.legacyUsers[0].invite_token, token);
      assert.equal(pending.outbox[0].kind, 'invite');
      await assert.rejects(authService.validateToken(token), { status: 404 });
      await authService.firstAccess(token, 'senha-admin-convite-123');

      const active = await store.readLocalData();
      const originalHash = active.legacyUsers[0].password_hash;

      assert.equal(active.legacyUsers[0].status, 'active');
      assert.equal(active.legacyUsers[0].invite_token, null);
      assert.ok(await bcrypt.compare('senha-admin-convite-123', originalHash!));
      await assert.rejects(adminService.inviteUser('admin-convite@example.test', 'cliente'), { status: 400 });
      await assert.rejects(authService.firstAccess(token, 'senha-substituta-123'), { status: 400 });
      assert.deepEqual(await store.readLocalData(), active);

      await withServer(async url => {
        const response = await fetch(url + '/api/admin/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'nao-criar@example.test', role: 'empresa' }),
        });

        assert.equal(response.status, 404);
      });

      assert.deepEqual(await store.readLocalData(), active);
    });

    await t.test('Cadastro HTTP exige perfil empresa, valida entrada e preserva consultas após reinício', async () => {
      await resetData();

      const company = {
        nome: 'Empresa de teste', cnpj: '12345678000190', descricao: 'Resumo',
        descricao_detalhada: 'Descrição para teste', categoria: 'Tecnologia',
        cidade: 'Fortaleza', estado: 'CE', tamanho: 'pequena',
      };
      const token = jwt.sign({ id: 'empresa-teste', role: 'empresa' }, process.env.JWT_SECRET!);
      const clientToken = jwt.sign({ id: 'cliente-teste', role: 'cliente' }, process.env.JWT_SECRET!);

      await withServer(async url => {
        async function create(body: unknown, bearer?: string) {
          return fetch(url + '/api/v1/empresas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}),
            },
            body: JSON.stringify(body),
          });
        }

        assert.equal((await create(company)).status, 401);
        assert.equal((await create(company, clientToken)).status, 403);
        assert.equal((await create({ ...company, nome: ' ' }, token)).status, 400);
        assert.equal((await create({ ...company, verificado: true }, token)).status, 400);
        assert.equal((await store.readLocalData()).companies.length, 0);

        const response = await create(company, token);
        const body = await response.json();

        assert.equal(response.status, 201);
        assert.equal(body.data.nome, company.nome);
        assert.equal(body.data.status, 'ativo');
        assert.equal(body.data.verificado, false);
        assert.match(body.data.id, /^[0-9a-f-]{36}$/);
        assert.ok(Number.isFinite(Date.parse(body.data.data_cadastro)));
        assert.equal((await store.readLocalData()).companies[0].id, body.data.id);

        for (const path of [
          '/api/v1/empresas',
          '/api/v1/empresas/categoria/tecnologia',
          '/api/v1/empresas/estado/ce',
          '/api/v1/empresas/tamanho/pequena',
          '/api/v1/empresas/buscar?q=Empresa',
        ]) {
          const listed = await fetch(url + path);

          assert.equal(listed.status, 200);
          assert.equal((await listed.json()).data[0].id, body.data.id);
        }

        const verified = await fetch(url + '/api/v1/empresas/verificadas/todas');

        assert.deepEqual((await verified.json()).data, []);
      });

      const restarted = runChild(`
        const { getCompanies } = await import('./src/services/company.service.ts');
        console.log(JSON.stringify((await getCompanies()).map(company => company.nome)));
      `);

      assert.equal(restarted.status, 0, restarted.stderr);
      assert.match(restarted.stdout, /Empresa de teste/);
    });

    await t.test('Convite local usa endereço padrão e preserva caracteres especiais do token', async () => {
      await resetData();

      const previousFrontendUrl = process.env.FRONTEND_URL;
      const token = 'convite+com/espaço?x=1&outro=2';

      delete process.env.FRONTEND_URL;

      try {
        await mailService.sendInviteEmail({ email: 'fallback@example.test', role: 'empresa', token });

        const mail = (await store.readLocalData()).outbox[0];
        const url = new URL(mail.url);

        assert.equal(url.origin, 'http://localhost:5173');
        assert.equal(url.pathname, '/primeiro-acesso');
        assert.equal(url.searchParams.get('token'), token);
        assert.equal(url.searchParams.size, 1);
      } finally {
        if (previousFrontendUrl === undefined) {
          delete process.env.FRONTEND_URL;
        } else {
          process.env.FRONTEND_URL = previousFrontendUrl;
        }
      }
    });

    await t.test('Bloqueio de outro processo impede gravação sem alterar arquivo ou remover o bloqueio', async () => {
      await resetData();

      const lockFile = join(temporaryRoot, 'data.lock');
      const before = await readFile(store.LOCAL_DATA_FILE, 'utf8');
      const owner = runChild(`
        import { writeFile } from 'node:fs/promises';
        import { join } from 'node:path';
        await writeFile(join(process.env.MOCK_DATA_DIR, 'data.lock'), String(process.pid), { flag: 'wx' });
        console.log(process.pid);
      `);

      assert.equal(owner.status, 0, owner.stderr);

      const ownerPid = owner.stdout.trim();
      let callbackCalled = false;

      try {
        await assert.rejects(store.updateLocalData(data => {
          callbackCalled = true;
          data.outbox.push({
            id: 'bloqueado', kind: 'invite', email: 'bloqueio@example.test',
            url: 'http://frontend.example.test', createdAt: new Date().toISOString(),
          });
        }), { status: 409 });

        assert.equal(callbackCalled, false);
        assert.equal(await readFile(lockFile, 'utf8'), ownerPid);
        assert.equal(await readFile(store.LOCAL_DATA_FILE, 'utf8'), before);
        assert.deepEqual(await store.readLocalData(), emptyLocalData());
      } finally {
        await unlink(lockFile);
      }

      await store.updateLocalData(data => {
        data.outbox.push({
          id: 'liberado', kind: 'invite', email: 'bloqueio@example.test',
          url: 'http://frontend.example.test', createdAt: new Date().toISOString(),
        });
      });

      assert.equal((await store.readLocalData()).outbox[0].id, 'liberado');
      assert.deepEqual(await readdir(temporaryRoot), ['data.json']);
    });

    await t.test('Operações concorrentes preservam todos os registros e limpam os temporários', async () => {
      await resetData();
      await Promise.all(Array.from({ length: 25 }, (_, index) => store.updateLocalData(async data => {
        await new Promise(resolve => setTimeout(resolve, index % 3));
        data.outbox.push({
          id: String(index), kind: 'invite', email: 'concorrencia@example.test',
          url: 'http://frontend.example.test/' + index, createdAt: new Date().toISOString(),
        });
      })));

      const stored = await store.readLocalData();

      assert.equal(stored.outbox.length, 25);
      assert.equal(new Set(stored.outbox.map(mail => mail.id)).size, 25);
      assert.deepEqual(await readdir(temporaryRoot), ['data.json']);
    });

    await t.test('JSON inválido permanece intacto e uma falha não interrompe a fila', async () => {
      const corrupted = '{ arquivo quebrado';

      await writeFile(store.LOCAL_DATA_FILE, corrupted, 'utf8');
      await assert.rejects(store.readLocalData(), { status: 500 });
      await assert.rejects(store.updateLocalData(data => { data.outbox = []; }), { status: 500 });
      assert.equal(await readFile(store.LOCAL_DATA_FILE, 'utf8'), corrupted);
      await resetData();
      await assert.rejects(store.updateLocalData(() => { throw new Error('Falha simulada.'); }), /Falha simulada/);
      assert.deepEqual(await store.readLocalData(), emptyLocalData());
    });

    await t.test('Flag false seleciona PostgreSQL e rejeita armazenamento e criação local sem conectar', async () => {
      const result = runChild(`
        import assert from 'node:assert/strict';
        const { userRepository } = await import('./src/persistence/user.repository.ts');
        const { userPostgresRepository } = await import('./src/persistence/postgres/user.repository.ts');
        const { createMockUser } = await import('./src/services/mock.user.service.ts');
        const { readLocalData } = await import('./src/persistence/json/local.store.ts');
        assert.equal(userRepository, userPostgresRepository);
        await assert.rejects(readLocalData(), /USE_MOCK_DATA=true/);
        await assert.rejects(createMockUser({}), /USE_MOCK_DATA=true/);
      `, 'false');

      assert.equal(result.status, 0, result.stderr);
    });

    await t.test('Modo PostgreSQL cadastra por SQL parametrizado sem acessar os dados locais', async () => {
      const preserved = '{ JSON local propositalmente inválido';

      await writeFile(store.LOCAL_DATA_FILE, preserved, 'utf8');

      const result = runChild(`
        import assert from 'node:assert/strict';
        import { once } from 'node:events';
        import jwt from 'jsonwebtoken';
        const { db } = await import('./src/shared/config/data.ts');
        const { app } = await import('./src/app.ts');
        const queries = [];
        db.query = async (text, values) => {
          queries.push({ text, values });
          return { rows: [{ id: values[0], nome: values[1], status: values[8], verificado: values[9] }] };
        };
        const server = app.listen(0, '127.0.0.1');
        try {
          await once(server, 'listening');
          const url = 'http://127.0.0.1:' + server.address().port + '/api/v1/empresas';
          const input = {
            nome: "Empresa '; DROP TABLE empresas; --", cnpj: '12345678000190',
            descricao: 'Resumo', descricao_detalhada: 'Descrição', categoria: 'Tecnologia',
            cidade: 'Fortaleza', estado: 'CE', tamanho: 'pequena',
          };
          const token = jwt.sign({ id: 'empresa-local-teste', role: 'empresa' }, process.env.JWT_SECRET);
          const client = jwt.sign({ id: 'cliente-local-teste', role: 'cliente' }, process.env.JWT_SECRET);
          const create = (body, bearer) => fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}) },
            body: JSON.stringify(body),
          });
          assert.equal((await create(input)).status, 401);
          assert.equal((await create(input, client)).status, 403);
          assert.equal((await create({ ...input, id: 'externo' }, token)).status, 400);
          assert.equal(queries.length, 0);
          const response = await create(input, token);
          const body = await response.json();
          assert.equal(response.status, 201);
          assert.equal(body.data.nome, input.nome);
          assert.equal(queries.length, 1);
          const { text, values } = queries[0];
          assert.match(text, /^INSERT INTO "empresas"/);
          assert.equal(text.includes('VALUES ($1, $2,'), true);
          assert.equal(text.endsWith('RETURNING *'), true);
          assert.equal(text.includes(input.nome), false);
          assert.match(values[0], /^[0-9a-f-]{36}$/);
          assert.equal(values[1], input.nome);
          assert.equal(values[8], 'ativo');
          assert.equal(values[9], false);
          assert.ok(Number.isFinite(Date.parse(values[11])));
          assert.equal(values.length, 20);
        } finally {
          server.closeAllConnections();
          await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        }
      `, 'false');

      assert.equal(result.status, 0, result.stderr);
      assert.equal(await readFile(store.LOCAL_DATA_FILE, 'utf8'), preserved);
      assert.deepEqual(await readdir(temporaryRoot), ['data.json']);
      await resetData();
    });

    await t.test('Flag com valor inválido impede inicialização em vez de selecionar um modo silenciosamente', () => {
      const result = runChild("await import('./src/shared/config/data.ts');", 'TRUE');

      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /USE_MOCK_DATA deve ser exatamente true ou false/);
    });

    assert.equal(query.mock.callCount(), 0);
    assert.equal(sendMail.mock.callCount(), 0);
  } finally {
    assert.equal(dirname(resolve(temporaryRoot)), resolve(tmpdir()));
    assert.ok(basename(temporaryRoot).startsWith('civix-local-persistence-'));
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
