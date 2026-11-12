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
import { PrismaPg } from '@prisma/adapter-pg';

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
const { authRepository } = await import('../src/persistence/index.js');
const mailService = await import('../src/services/mail.service.js');
const { app } = await import('../src/app.js');

async function resetData() {
  await writeFile(store.LOCAL_DATA_FILE, JSON.stringify(emptyLocalData()), 'utf8');
}

function runChild(source: string, flag = 'true') {
  return spawnSync(
    process.execPath,
    ['--import', 'tsx', '--input-type=module', '-e', source],
    {
      cwd: process.cwd(),
      env: { ...process.env, USE_MOCK_DATA: flag, MOCK_DATA_DIR: temporaryRoot },
      encoding: 'utf8',
      timeout: 20000,
    },
  );
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
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const companyService = await import('../src/services/company.service.js');
const companyInput = {
  nome: 'Empresa de teste',
  cnpj: 'cnpj-local',
  descricao: 'Resumo',
  descricao_detalhada: 'Descrição',
  categoria: 'Tecnologia',
  cidade: 'Fortaleza',
  estado: 'CE',
  tamanho: 'pequena',
};
async function prepareCompany() {
  await resetData();
  return companyService.createCompany(companyInput);
}

test('Persistência local preserva acesso, convites, recuperação e integridade sem serviços externos', async (t) => {
  const query = t.mock.method(PrismaPg.prototype, 'connect', async () => {
    throw new Error('PostgreSQL não permitido neste teste.');
  });
  const sendMail = t.mock.method(Resend.prototype, 'post', async () => {
    throw new Error('Envio externo não permitido.');
  });
  try {
    await t.test(
      'Conta local persiste senha protegida e sobrevive a reinício',
      async () => {
        const company = await prepareCompany();
        const user = await createMockUser({
          email: 'Admin@example.test',
          role: 'admin_empresa',
          companyId: company.id,
          password: 'senha-local-123',
        });
        const stored = (await store.readLocalData()).users[0];
        assert.equal(stored.email, 'admin@example.test');
        assert.ok(await bcrypt.compare('senha-local-123', stored.password_hash!));
        assert.notEqual(stored.password_hash, 'senha-local-123');
        const login = await userService.login({
          email: stored.email.toUpperCase(),
          password: 'senha-local-123',
        });
        assert.equal(login.user.id, user.id);
        assert.equal(login.user.companyId, company.id);
        const restarted = runChild(
          "const {readLocalData}=await import('./src/persistence/json/local.store.ts'); console.log(JSON.stringify(await readLocalData()));",
        );
        assert.equal(restarted.status, 0, restarted.stderr);
        assert.match(restarted.stdout, /admin@example.test/);
        await assert.rejects(
          createMockUser({ email: 'ADMIN@example.test', role: 'cliente' }),
          { status: 409 },
        );
      },
    );

    await t.test(
      'Recuperação mantém token bruto só no outbox, expiração e consumo único',
      async () => {
        const company = await prepareCompany();
        await createMockUser({
          email: 'reset@example.test',
          role: 'admin_empresa',
          companyId: company.id,
          password: 'senha-antiga-123',
        });
        await userService.forgotPassword('RESET@example.test');
        const data = await store.readLocalData();
        const token = new URL(data.outbox[0].url).searchParams.get('token')!;
        assert.notEqual(data.users[0].reset_password_token, token);
        assert.ok(
          new Date(data.users[0].reset_password_expires!).getTime() > Date.now(),
        );
        await userService.resetPassword({ token, password: 'senha-nova-123' });
        await assert.rejects(
          userService.resetPassword({ token, password: 'outra-senha-123' }),
          { status: 400 },
        );
        await assert.rejects(
          userService.login({
            email: 'reset@example.test',
            password: 'senha-antiga-123',
          }),
          { status: 401 },
        );
        assert.ok(
          (
            await userService.login({
              email: 'reset@example.test',
              password: 'senha-nova-123',
            })
          ).token,
        );
        const before = (await store.readLocalData()).outbox.length;
        await userService.forgotPassword('ausente@example.test');
        assert.equal((await store.readLocalData()).outbox.length, before);
      },
    );

    await t.test(
      'Plano ativo é associado ao usuário sem apagar as demais coleções',
      async () => {
        const company = await prepareCompany();
        const user = await createMockUser({
          email: 'plano@example.test',
          role: 'admin_empresa',
          companyId: company.id,
          password: 'senha-local-123',
        });
        await store.updateLocalData((data) => {
          data.plans.push({
            id: '1',
            name: 'Inicial',
            slug: 'inicial',
            description: '',
            price: '10.00',
            billing_period: 'monthly',
            features: [],
            limits: {},
            is_featured: false,
            is_active: true,
            display_order: 1,
          });
        });
        assert.equal((await planService.assignPlanToUser(user.id, '1'))!.id, '1');
        assert.equal((await store.readLocalData()).users[0].plan_id, '1');
        assert.equal(await planService.assignPlanToUser(user.id, 'ausente'), null);
        assert.equal((await store.readLocalData()).companies.length, 1);
      },
    );

    await t.test(
      'Convite empresarial valida vínculo, pré-valida, ativa e rejeita reuso',
      async () => {
        const company = await prepareCompany();
        await adminService.inviteUser('convite@example.test', 'atendente', company.id);
        let data = await store.readLocalData();
        const token = data.users[0].invite_token!;
        const claims = jwt.verify(
          token,
          process.env.JWT_INVITE_SECRET!,
        ) as jwt.JwtPayload;
        assert.equal(claims.purpose, 'invite');
        assert.equal(claims.companyId, company.id);
        assert.deepEqual(await authService.validateToken(token), {
          email: 'convite@example.test',
        });
        await assert.rejects(
          userService.login({
            email: 'convite@example.test',
            password: 'senha-local-123',
          }),
          { status: 401 },
        );
        await authService.firstAccess(token, 'senha-local-123');
        await assert.rejects(authService.firstAccess(token, 'outra-senha-123'), {
          status: 400,
        });
        assert.ok(
          (
            await userService.login({
              email: 'convite@example.test',
              password: 'senha-local-123',
            })
          ).token,
        );
        await assert.rejects(
          adminService.inviteUser('convite@example.test', 'admin_empresa', company.id),
          { status: 409 },
        );
        await assert.rejects(
          adminService.inviteUser('cliente@example.test', 'cliente', company.id),
          { status: 400 },
        );
        data = await store.readLocalData();
        assert.equal(data.users[0].role, 'atendente');
        assert.equal(data.users[0].company_id, company.id);
      },
    );

    await t.test('Ativações concorrentes consomem convite uma única vez', async () => {
      const company = await prepareCompany();
      await adminService.inviteUser(
        'corrida@example.test',
        'admin_empresa',
        company.id,
      );
      const account = (await store.readLocalData()).users[0];
      const results = await Promise.all([
        authRepository.activateUser(account.id, 'hash-a', account.invite_token!),
        authRepository.activateUser(account.id, 'hash-b', account.invite_token!),
      ]);
      assert.equal(results.filter(Boolean).length, 1);
      const activated = (await store.readLocalData()).users[0];
      assert.equal(activated.status, 'active');
      assert.equal(activated.invite_token, null);
    });

    await t.test(
      'Cadastro HTTP permite superadmin e nega perfil empresarial sem expor admin router',
      async () => {
        const company = await prepareCompany();
        await store.updateLocalData((data) => {
          data.plans.push({
            id: 'plano-cadastro',
            name: 'Plano sintético',
            slug: 'plano-cadastro',
            description: 'Plano de teste',
            price: '39.90',
            billing_period: 'monthly',
            features: [],
            limits: {},
            is_featured: false,
            is_active: true,
            display_order: 1,
          });
        });
        await createMockUser({
          email: 'super@example.test',
          role: 'super_admin',
          password: 'senha-local-123',
        });
        await createMockUser({
          email: 'admin@example.test',
          role: 'admin_empresa',
          companyId: company.id,
          password: 'senha-local-123',
        });
        const superLogin = await userService.login({
          email: 'super@example.test',
          password: 'senha-local-123',
        });
        const adminLogin = await userService.login({
          email: 'admin@example.test',
          password: 'senha-local-123',
        });
        await withServer(async (url) => {
          const send = (token: string, input: unknown) =>
            fetch(url + '/api/v1/empresas', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
              },
              body: JSON.stringify(input),
            });
          const registration = {
            ...companyInput,
            cnpj: 'segunda-empresa',
            planId: 'plano-cadastro',
            operationId: '40000000-0000-4000-8000-000000000001',
          };
          assert.equal((await send(adminLogin.token, registration)).status, 403);
          const created = await send(superLogin.token, registration);
          assert.equal(created.status, 201);
          const result = (await created.json()).data;
          assert.equal(result.company.cnpj, registration.cnpj);
          assert.equal(result.company.plan_id, registration.planId);
          assert.equal(result.sale.companyId, result.company.id);
          assert.equal(result.sale.amount, '39.90');
          assert.equal(result.replayed, false);
          assert.equal(
            (await send(superLogin.token, { ...registration, id: 'arbitrario' }))
              .status,
            400,
          );
          assert.equal(
            (await fetch(url + '/api/v1/admin/invite', { method: 'POST' })).status,
            404,
          );
          const list = await fetch(url + '/api/v1/empresas');
          assert.equal((await list.json()).data.length, 2);
          const detail = await fetch(url + '/api/v1/empresas/' + company.id);
          assert.equal((await detail.json()).data.nome, companyInput.nome);
        });
      },
    );

    await t.test(
      'Bloqueio de outro processo impede gravação sem alterar arquivo ou remover o bloqueio',
      async () => {
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
          await assert.rejects(
            store.updateLocalData((data) => {
              callbackCalled = true;
              data.outbox.push({
                id: 'bloqueado',
                kind: 'invite',
                email: 'bloqueio@example.test',
                url: 'http://frontend.example.test',
                createdAt: new Date().toISOString(),
              });
            }),
            { status: 409 },
          );

          assert.equal(callbackCalled, false);
          assert.equal(await readFile(lockFile, 'utf8'), ownerPid);
          assert.equal(await readFile(store.LOCAL_DATA_FILE, 'utf8'), before);
          assert.deepEqual(await store.readLocalData(), emptyLocalData());
        } finally {
          await unlink(lockFile);
        }

        await store.updateLocalData((data) => {
          data.outbox.push({
            id: 'liberado',
            kind: 'invite',
            email: 'bloqueio@example.test',
            url: 'http://frontend.example.test',
            createdAt: new Date().toISOString(),
          });
        });

        assert.equal((await store.readLocalData()).outbox[0].id, 'liberado');
        assert.deepEqual(await readdir(temporaryRoot), ['data.json']);
      },
    );

    await t.test(
      'Operações concorrentes preservam todos os registros e limpam os temporários',
      async () => {
        await resetData();
        await Promise.all(
          Array.from({ length: 25 }, (_, index) =>
            store.updateLocalData(async (data) => {
              await new Promise((resolve) => setTimeout(resolve, index % 3));
              data.outbox.push({
                id: String(index),
                kind: 'invite',
                email: 'concorrencia@example.test',
                url: 'http://frontend.example.test/' + index,
                createdAt: new Date().toISOString(),
              });
            }),
          ),
        );

        const stored = await store.readLocalData();

        assert.equal(stored.outbox.length, 25);
        assert.equal(new Set(stored.outbox.map((mail) => mail.id)).size, 25);
        assert.deepEqual(await readdir(temporaryRoot), ['data.json']);
      },
    );

    await t.test(
      'JSON inválido permanece intacto e uma falha não interrompe a fila',
      async () => {
        const corrupted = '{ arquivo quebrado';

        await writeFile(store.LOCAL_DATA_FILE, corrupted, 'utf8');
        await assert.rejects(store.readLocalData(), { status: 500 });
        await assert.rejects(
          store.updateLocalData((data) => {
            data.outbox = [];
          }),
          { status: 500 },
        );
        assert.equal(await readFile(store.LOCAL_DATA_FILE, 'utf8'), corrupted);
        await resetData();
        await assert.rejects(
          store.updateLocalData(() => {
            throw new Error('Falha simulada.');
          }),
          /Falha simulada/,
        );
        assert.deepEqual(await store.readLocalData(), emptyLocalData());
      },
    );

    await t.test(
      'Flag false seleciona PostgreSQL e rejeita armazenamento e criação local sem conectar',
      async () => {
        const result = runChild(
          `
        import assert from 'node:assert/strict';
        const { userRepository } = await import('./src/persistence/index.ts');
        const { userPostgresRepository } = await import('./src/persistence/postgres/user.repository.ts');
        const { createMockUser } = await import('./src/services/mock.user.service.ts');
        const { readLocalData } = await import('./src/persistence/json/local.store.ts');
        assert.equal(userRepository, userPostgresRepository);
        await assert.rejects(readLocalData(), /USE_MOCK_DATA=true/);
        await assert.rejects(createMockUser({}), /USE_MOCK_DATA=true/);
      `,
          'false',
        );

        assert.equal(result.status, 0, result.stderr);
      },
    );

    await t.test(
      'Flag com valor inválido impede inicialização em vez de selecionar um modo silenciosamente',
      () => {
        const result = runChild("await import('./src/shared/config/data.ts');", 'TRUE');

        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /USE_MOCK_DATA deve ser exatamente true ou false/);
      },
    );

    assert.equal(query.mock.callCount(), 0);
    assert.equal(sendMail.mock.callCount(), 0);
  } finally {
    assert.equal(dirname(resolve(temporaryRoot)), resolve(tmpdir()));
    assert.ok(basename(temporaryRoot).startsWith('civix-local-persistence-'));
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
