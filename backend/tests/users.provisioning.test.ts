import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import bcrypt from 'bcrypt';

const temporaryRoot = await mkdtemp(join(tmpdir(), 'civix-users-provisioning-'));
Object.assign(process.env, {
  USE_MOCK_DATA: 'true', MOCK_DATA_DIR: temporaryRoot,
  JWT_SECRET: 'segredo-isolado-de-provisionamento',
  DATABASE_URL: 'postgresql://teste:teste@127.0.0.1:1/teste',
});

const { bootstrapSuperAdmin } = await import('../src/services/user.bootstrap.service.js');
const { login } = await import('../src/services/user.service.js');
const { readLocalData } = await import('../src/persistence/json/local.store.js');
const { emptyLocalData } = await import('../src/persistence/json/local.data.js');
const { db } = await import('../src/shared/config/data.js');
const file = join(temporaryRoot, 'data.json');
const mapFile = join(temporaryRoot, 'bindings.json');
const companyId = '10000000-0000-4000-8000-000000000001';
const legacyUserId = '20000000-0000-4000-8000-000000000001';
const clientId = '20000000-0000-4000-8000-000000000002';
const password = 'senha-provisionamento-123';

function legacyData() {
  return {
    version: 1,
    companies: [{
      id: companyId, nome: 'Empresa preservada', cnpj: '12345678000190',
      descricao: 'Resumo', descricao_detalhada: 'Descrição', categoria: 'Tecnologia',
      cidade: 'Fortaleza', estado: 'CE', status: 'ativo', verificado: false, tamanho: 'pequena',
    }],
    users: [
      { id: legacyUserId, email: 'admin@example.test', role: 'empresa', status: 'active', name: 'Administrador anterior' },
      { id: clientId, email: 'cliente@example.test', role: 'cliente', status: 'active', name: 'Cliente preservado' },
    ],
    plans: [], outbox: [],
  };
}

function migrate(mappingPath?: string) {
  return spawnSync(process.execPath, [
    '--import', 'tsx', 'scripts/migrate.local.roles.ts', ...(mappingPath ? [mappingPath] : []),
  ], {
    cwd: resolve(import.meta.dirname, '..'),
    env: { ...process.env, USE_MOCK_DATA: 'true', MOCK_DATA_DIR: temporaryRoot },
    encoding: 'utf8', timeout: 20000,
  });
}

test('Provisionamento explícito preserva contas e dados legados', async t => {
  t.mock.method(db, 'query', () => { throw new Error('Este teste não permite conexão PostgreSQL.'); });
  try {
    await t.test('Bootstrap cria superadmin com bcrypt10 e sem vínculo empresarial', async () => {
      await writeFile(file, JSON.stringify(emptyLocalData()));
      await bootstrapSuperAdmin({ email: 'Super@Example.test', password, name: 'Admin inicial' });
      const stored = (await readLocalData()).users[0];
      assert.match(String(stored.id), /^[0-9a-f-]{36}$/);
      assert.equal(stored.email, 'super@example.test');
      assert.equal(stored.role, 'super_admin');
      assert.equal(stored.company_id, null);
      assert.equal(stored.status, 'active');
      assert.notEqual(stored.password_hash, password);
      assert.equal(bcrypt.getRounds(stored.password_hash!), 10);
      assert.ok(await bcrypt.compare(password, stored.password_hash!));
      assert.equal((await login({ email: 'SUPER@example.test', password })).user.role, 'super_admin');
    });

    await t.test('Bootstrap nunca promove conta existente, mesmo com caixa diferente', async () => {
      const snapshot = emptyLocalData();
      snapshot.users.push({ id: clientId, email: 'cliente@example.test', role: 'cliente', company_id: null, name: 'Cliente', status: 'active' });
      await writeFile(file, JSON.stringify(snapshot));
      const before = await readFile(file);
      await assert.rejects(bootstrapSuperAdmin({ email: 'CLIENTE@example.test', password }), { status: 409 });
      assert.deepEqual(await readFile(file), before);
      assert.equal((await readLocalData()).users[0].role, 'cliente');
    });

    await t.test('Conversão exige mapa válido e não altera arquivo em falhas', async () => {
      for (const mapping of [undefined, {}, { [legacyUserId]: 'invalido' }, { [legacyUserId]: '30000000-0000-4000-8000-000000000001' }]) {
        const before = Buffer.from(JSON.stringify(legacyData(), null, 4) + '\r\n');
        await writeFile(file, before);
        if (mapping !== undefined) await writeFile(mapFile, JSON.stringify(mapping));
        const result = migrate(mapping === undefined ? undefined : mapFile);
        assert.notEqual(result.status, 0);
        assert.deepEqual(await readFile(file), before);
        const files = await readdir(temporaryRoot);
        assert.equal(files.some(name => name.endsWith('.backup') || name.endsWith('.tmp') || name === 'data.lock'), false);
        assert.equal(result.stdout, '');
      }
    });

    await t.test('Conversão com mapa mantém backup exato e cliente sem login', async () => {
      const snapshot = legacyData();
      const before = Buffer.from(JSON.stringify(snapshot, null, 4) + '\r\n');
      await writeFile(file, before);
      await writeFile(mapFile, JSON.stringify({ [legacyUserId]: companyId }));
      const result = migrate(mapFile);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, '');
      assert.ok(!result.stderr.includes(password));
      const files = await readdir(temporaryRoot);
      const backups = files.filter(name => name.endsWith('.backup'));
      assert.equal(backups.length, 1);
      assert.deepEqual(await readFile(join(temporaryRoot, backups[0])), before);
      assert.equal(files.some(name => name.endsWith('.tmp') || name === 'data.lock'), false);
      const migrated = await readLocalData();
      const admin = migrated.users.find(user => user.id === legacyUserId)!;
      const client = migrated.users.find(user => user.id === clientId)!;
      assert.equal(admin.role, 'admin_empresa');
      assert.equal(admin.company_id, companyId);
      assert.equal(admin.name, snapshot.users[0].name);
      assert.equal(client.role, 'cliente');
      assert.equal(client.company_id, null);
      assert.equal(client.name, snapshot.users[1].name);
      assert.deepEqual(migrated.companies, snapshot.companies);
      assert.deepEqual(migrated.plans, snapshot.plans);
      assert.deepEqual(migrated.outbox, snapshot.outbox);
      await assert.rejects(login({ email: client.email, password, role: 'cliente' }), { status: 403 });
    });
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
