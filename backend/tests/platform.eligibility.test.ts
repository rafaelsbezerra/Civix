import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const temporaryRoot = await mkdtemp(join(tmpdir(), 'civix-platform-eligibility-'));
const dataFile = join(temporaryRoot, 'data.json');
const superAdminId = randomUUID();
const activeCompanyId = randomUUID();
const legacyCompanyId = randomUUID();
const inactiveCompanyId = randomUUID();
const archivedCompanyId = randomUUID();
const companyIds = [activeCompanyId, legacyCompanyId, inactiveCompanyId, archivedCompanyId];
const imageIds = new Map<string, string>(companyIds.map(id => [id, randomUUID()] as const));
const logoIds = new Map<string, string>(companyIds.map(id => [id, randomUUID()] as const));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/b9sAAAAASUVORK5CYII=', 'base64');

Object.assign(process.env, {
  USE_MOCK_DATA: 'true',
  MOCK_DATA_DIR: temporaryRoot,
  JWT_SECRET: 'segredo-sintetico-platform-eligibility',
  LOG_LEVEL: 'fatal',
});

function makeCompany(id: string, status: 'ativo' | 'inativo' | 'verificado', deletedAt: string | null = null) {
  return {
    id,
    nome: 'Elegibilidade Serviços',
    cnpj: id,
    descricao: 'Fixture sintética',
    descricao_detalhada: 'Fixture sintética para elegibilidade pública.',
    categoria: 'Serviços',
    cidade: 'Fortaleza',
    estado: 'CE',
    status,
    verificado: status === 'verificado' || status === 'inativo' || deletedAt !== null,
    tamanho: 'pequena',
    cover_key: `companies/${id}/cover.png`,
    logo_key: `companies/${id}/logo.png`,
    deleted_at: deletedAt,
  };
}

function fixture() {
  const companies = [
    makeCompany(activeCompanyId, 'ativo'),
    makeCompany(legacyCompanyId, 'verificado'),
    makeCompany(inactiveCompanyId, 'inativo'),
    makeCompany(archivedCompanyId, 'ativo', '2026-11-02T12:00:00.000Z'),
  ];

  return {
    version: 1,
    companies,
    users: [{ id: superAdminId, email: 'super-admin@example.test', role: 'super_admin', name: 'Superadmin sintético',
      password_hash: 'hash-sintetico-nao-usado', status: 'active', company_id: null }],
    images: companies.flatMap(company => (['cover', 'logo'] as const).map(purpose => ({
      id: (purpose === 'cover' ? imageIds : logoIds).get(company.id)!,
      object_key: purpose === 'cover' ? company.cover_key : company.logo_key,
      original_name: 'capa.png',
      mime_type: 'image/png',
      size_bytes: png.length,
      module: 'companies',
      resource_id: company.id,
      purpose,
      uploaded_by: superAdminId,
      created_at: '2026-11-02T12:00:00.000Z',
    }))),
    plans: [],
    sales: [],
    companyRegistrationOperations: [],
    outbox: [],
  };
}

test('elegibilidade pública exclui empresas suspensas/arquivadas sem apagar histórico ou imagens', async t => {
  const initialData = fixture();
  const { app } = await import('../src/app.js');
  const { signToken } = await import('../src/services/auth.service.js');
  const { readLocalData } = await import('../src/persistence/json/local.store.js');
  const { imageObjectStore } = await import('../src/shared/integrations/cloudflare/storage.provider.js');
  const { companyService } = await import('../src/services/company.service.js').then(module => ({ companyService: module }));
  const signedKeys: string[] = [];
  const uploadedKeys: string[] = [];

  t.mock.method(imageObjectStore, 'getPresignedUrl', async (key: string, seconds: number) => {
    assert.equal(seconds, 300);
    signedKeys.push(key);
    return `https://images.example.test/${encodeURIComponent(key)}?expires=${seconds}`;
  });
  t.mock.method(imageObjectStore, 'upload', async (key: string) => { uploadedKeys.push(key); });

  const bearer = signToken({ id: superAdminId, email: 'super-admin@example.test', role: 'super_admin',
    companyId: null, tokenVersion: 2 }, '1h');
  const server = app.listen(0, '127.0.0.1');

  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    await writeFile(dataFile, JSON.stringify(initialData), 'utf8');

    const publicCompanyIds = new Set([activeCompanyId, legacyCompanyId]);
    const publicListPaths = [
      { path: '/api/v1/empresas', expectedIds: publicCompanyIds },
      { path: '/api/v1/empresas/verificadas/todas', expectedIds: new Set([legacyCompanyId]) },
      { path: '/api/v1/empresas/buscar?q=Elegibilidade', expectedIds: publicCompanyIds },
      { path: `/api/v1/empresas/categoria/${encodeURIComponent('Serviços')}`, expectedIds: publicCompanyIds },
      { path: '/api/v1/empresas/estado/CE', expectedIds: publicCompanyIds },
      { path: '/api/v1/empresas/tamanho/pequena', expectedIds: publicCompanyIds },
    ];

    for (const { path, expectedIds } of publicListPaths) {
      const response = await fetch(baseUrl + path);
      assert.equal(response.status, 200, path);
      const body = await response.json() as { data: Array<{ id: string }> };
      assert.deepEqual(new Set(body.data.map(company => company.id)), expectedIds, path);
    }

    assert.equal((await fetch(`${baseUrl}/api/v1/empresas/${activeCompanyId}`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/api/v1/empresas/${legacyCompanyId}`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/api/v1/empresas/${inactiveCompanyId}`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/api/v1/empresas/${archivedCompanyId}`)).status, 404);

    const archive = (await readLocalData()).companies.find(company => company.id === archivedCompanyId)!;
    signedKeys.length = 0;
    const publicArchive = await companyService.presentCompany(archive);
    assert.equal(publicArchive.cover_image_url, null);
    assert.equal(publicArchive.logo, null);
    assert.deepEqual(signedKeys, []);

    for (const companyId of [inactiveCompanyId, archivedCompanyId]) {
      for (const purpose of ['cover', 'logo'] as const) {
        const imageId = (purpose === 'cover' ? imageIds : logoIds).get(companyId)!;
        const urlResponse = await fetch(`${baseUrl}/api/v1/storage/images/${imageId}/url`);
        assert.equal(urlResponse.status, 404);

        const form = new FormData();
        form.set('module', 'companies');
        form.set('resourceId', companyId);
        form.set('purpose', purpose);
        form.set('file', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'capa.png');
        const uploadResponse = await fetch(`${baseUrl}/api/v1/storage/images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${bearer}` },
          body: form,
        });
        assert.equal(uploadResponse.status, 404);
      }
    }

    assert.deepEqual(uploadedKeys, []);
    const after = await readLocalData();
    assert.deepEqual(after.companies, initialData.companies);
    assert.deepEqual(after.images, initialData.images);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
