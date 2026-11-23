import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import bcrypt from 'bcrypt';
const directory = await mkdtemp(join(tmpdir(), 'civix-users-provisioning-'));
Object.assign(process.env, {
  USE_MOCK_DATA: 'true',
  MOCK_DATA_DIR: directory,
  JWT_SECRET: 'segredo-provisionamento-sintetico',
  LOG_LEVEL: 'fatal',
});
const { createMockUser } = await import('../src/services/mock.user.service.js');
const { login } = await import('../src/services/user.service.js');
const { readLocalData } = await import('../src/persistence/json/local.store.js');
const { emptyLocalData } = await import('../src/persistence/json/local.data.js');
const { PrismaPg } = await import('@prisma/adapter-pg');
const companyId = '10000000-0000-4000-8000-000000000001';
const password = 'senha-sintetica-provisionamento';
const file = join(directory, 'data.json');
function fixture() {
  const data = emptyLocalData();
  data.companies.push({
    id: companyId,
    nome: 'Empresa sintética',
    cnpj: '12345678000190',
    descricao: '',
    descricao_detalhada: '',
    categoria: 'Tecnologia',
    cidade: 'Fortaleza',
    estado: 'CE',
    status: 'ativo',
    verificado: false,
    tamanho: 'pequena',
  });
  return data;
}
test('provisionamento local usa serviço existente sem sobrescrever contas', async (t) => {
  t.mock.method(PrismaPg.prototype, 'connect', () => {
    throw new Error('PostgreSQL não permitido no teste.');
  });
  try {
    await t.test(
      'cria UUID, e-mail normalizado e bcrypt10 para superadmin sem empresa',
      async () => {
        await writeFile(file, JSON.stringify(fixture()));
        const result = await createMockUser({
          email: 'SUPER@example.test',
          role: 'super_admin',
          password,
          name: 'Pessoa teste',
        });
        const stored = (await readLocalData()).users[0];
        assert.match(
          String(result.id),
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
        assert.equal(stored.email, 'super@example.test');
        assert.equal(stored.company_id, null);
        assert.equal(stored.status, 'active');
        assert.equal(stored.invite_token, null);
        assert.notEqual(stored.password_hash, password);
        assert.equal(bcrypt.getRounds(stored.password_hash!), 10);
        assert.ok(await bcrypt.compare(password, stored.password_hash!));
        assert.equal(
          (await login({ email: 'SUPER@example.test', password })).user.id,
          result.id,
        );
      },
    );
    await t.test('duplicidade não promove cliente nem altera dados', async () => {
      await writeFile(file, JSON.stringify(fixture()));
      await createMockUser({ email: 'cliente@example.test', role: 'cliente' });
      const before = await readFile(file);
      await assert.rejects(
        createMockUser({
          email: 'CLIENTE@example.test',
          role: 'super_admin',
          password,
        }),
        { status: 409 },
      );
      assert.deepEqual(await readFile(file), before);
      await assert.rejects(
        login({ email: 'cliente@example.test', role: 'cliente', password }),
        { status: 403 },
      );
    });
    await t.test(
      'valida senha, papéis e vínculo único com empresa existente',
      async () => {
        await writeFile(file, JSON.stringify(fixture()));
        for (const role of ['admin_empresa', 'atendente']) {
          const before = await readFile(file);
          for (const companyId of [
            undefined,
            null,
            'invalid',
            '30000000-0000-4000-8000-000000000001',
          ]) {
            await assert.rejects(
              createMockUser({
                email: role + '@example.test',
                role,
                password,
                companyId,
              }),
              { status: 400 },
            );
            assert.deepEqual(await readFile(file), before);
          }
          await createMockUser({
            email: role + '@example.test',
            role,
            password,
            companyId,
          });
        }
        for (const role of ['super_admin', 'cliente']) {
          await assert.rejects(
            createMockUser({
              email: role + '@example.test',
              role,
              password,
              companyId,
            }),
            { status: 400 },
          );
        }
        for (const role of ['super_admin', 'admin_empresa', 'atendente']) {
          await assert.rejects(
            createMockUser({
              email: 'sem-senha@example.test',
              role,
              companyId: role === 'super_admin' ? null : companyId,
            }),
            { status: 400 },
          );
        }
        assert.equal((await readLocalData()).users.length, 2);
        assert.ok(
          (await readLocalData()).users.every((user) => user.company_id === companyId),
        );
      },
    );
    await t.test(
      'modo real bloqueia serviço antes de escrever ou acessar banco',
      async () => {
        const before = await readFile(file);
        const script =
          "const {createMockUser}=await import('./src/services/mock.user.service.ts');try{await createMockUser({email:'real@example.test',role:'super_admin',password:'senha-sintetica'});process.exitCode=2}catch(e){if(!e.message.includes('USE_MOCK_DATA=true'))throw e}";
        const result = spawnSync(
          process.execPath,
          ['--import', 'tsx', '--input-type=module', '-e', script],
          {
            cwd: resolve(import.meta.dirname, '..'),
            env: {
              ...process.env,
              USE_MOCK_DATA: 'false',
              DATABASE_URL: 'postgresql://teste:teste@127.0.0.1:1/teste',
            },
            encoding: 'utf8',
            timeout: 20000,
          },
        );
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout, '');
        assert.deepEqual(await readFile(file), before);
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
