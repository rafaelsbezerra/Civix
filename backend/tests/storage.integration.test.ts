import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import test from 'node:test';

const temporaryRoot = await mkdtemp(join(tmpdir(), 'civix-storage-integration-'));
const dataFile = join(temporaryRoot, 'data.json');

Object.assign(process.env, {
  USE_MOCK_DATA: 'true',
  MOCK_DATA_DIR: temporaryRoot,
  JWT_SECRET: 'segredo-isolado-dos-testes-de-storage',
  LOG_LEVEL: 'fatal',
});

const companyAId = randomUUID();
const companyBId = randomUUID();
const adminId = randomUUID();
const superAdminId = randomUUID();
const attendantId = randomUUID();
const customerId = randomUUID();
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/b9sAAAAASUVORK5CYII=',
  'base64',
);

function company(id: string, name: string) {
  return {
    id,
    nome: name,
    cnpj: id,
    descricao: 'Resumo',
    descricao_detalhada: 'Descrição',
    categoria: 'Construção',
    cidade: 'Fortaleza',
    estado: 'CE',
    status: 'ativo',
    verificado: false,
    tamanho: 'pequena',
    cover_key: null,
    logo_key: null,
  };
}

function fixture() {
  return {
    version: 1,
    companies: [company(companyAId, 'Empresa A'), company(companyBId, 'Empresa B')],
    users: [
      {
        id: adminId,
        email: 'admin@example.test',
        role: 'admin_empresa',
        company_id: companyAId,
      },
      {
        id: superAdminId,
        email: 'super@example.test',
        role: 'super_admin',
        company_id: null,
      },
      {
        id: attendantId,
        email: 'atendente@example.test',
        role: 'atendente',
        company_id: companyAId,
      },
      {
        id: customerId,
        email: 'cliente@example.test',
        role: 'cliente',
        company_id: null,
      },
    ].map((user) => ({
      ...user,
      name: 'Usuário de teste',
      status: 'active',
      password_hash: 'hash-nao-usado-no-teste',
    })),
    plans: [],
    outbox: [],
    images: [],
  };
}

interface StoredImage {
  id: string;
  object_key: string;
  resource_id: string;
  purpose: string;
  uploaded_by: string;
}

interface StoredData {
  companies: Array<{ id: string; cover_key?: string | null; logo_key?: string | null }>;
  images: StoredImage[];
}

async function readData(): Promise<StoredData> {
  return JSON.parse(await readFile(dataFile, 'utf8'));
}

function multipart(
  options: {
    companyId?: string;
    buffer?: Buffer;
    mime?: string;
    purpose?: string;
    includeFile?: boolean;
  } = {},
) {
  const form = new FormData();
  form.set('module', 'companies');
  form.set('resourceId', options.companyId ?? companyAId);
  form.set('purpose', options.purpose ?? 'cover');

  if (options.includeFile !== false) {
    const bytes = new Uint8Array(options.buffer ?? png);
    form.set(
      'file',
      new Blob([bytes], { type: options.mime ?? 'image/png' }),
      'capa.png',
    );
  }

  return form;
}

test('Storage integra HTTP, autorização e metadados com R2 simulado', async (t) => {
  const { app } = await import('../src/app.js');
  const { signToken } = await import('../src/services/auth.service.js');
  const { imageObjectStore } =
    await import('../src/shared/integrations/cloudflare/storage.provider.js');
  const { storageRepository } = await import('../src/persistence/index.js');
  const { companyRepository } = await import('../src/persistence/index.js');
  const uploaded: string[] = [];
  const deleted: string[] = [];
  const signed: Array<{ key: string; seconds: number }> = [];

  t.mock.method(imageObjectStore, 'upload', async (key: string) => {
    uploaded.push(key);
  });
  t.mock.method(imageObjectStore, 'delete', async (key: string) => {
    deleted.push(key);
  });
  t.mock.method(
    imageObjectStore,
    'getPresignedUrl',
    async (key: string, seconds: number) => {
      signed.push({ key, seconds });
      return `https://images.example.test/${encodeURIComponent(key)}?expires=${seconds}`;
    },
  );

  function token(id = adminId, legacy = false) {
    const user = fixture().users.find((entry) => entry.id === id)!;
    return signToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        ...(legacy ? {} : { tokenVersion: 2 }),
      },
      '1h',
    );
  }

  const server = app.listen(0, '127.0.0.1');

  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    async function reset() {
      await writeFile(dataFile, JSON.stringify(fixture()), 'utf8');
      uploaded.length = 0;
      deleted.length = 0;
      signed.length = 0;
    }

    function upload(form = multipart(), accessToken: string | null = token()) {
      return fetch(`${baseUrl}/api/v1/storage/images`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: form,
      });
    }

    await t.test(
      'Admin envia capa e consulta pública devolve URL de cinco minutos sem expor chaves',
      async () => {
        await reset();
        const response = await upload();
        assert.equal(response.status, 201);
        const body = await response.json();
        assert.equal(body.data.target.resourceId, companyAId);
        assert.equal(body.data.target.purpose, 'cover');
        const data = await readData();
        assert.equal(data.images.length, 1);
        assert.equal(data.images[0].id, body.data.imageId);
        assert.equal(data.images[0].uploaded_by, adminId);
        assert.equal(data.companies[0].cover_key, data.images[0].object_key);
        assert.deepEqual(uploaded, [data.images[0].object_key]);

        const detail = await fetch(`${baseUrl}/api/v1/empresas/${companyAId}`);
        assert.equal(detail.status, 200);
        const companyBody = await detail.json();
        assert.match(
          companyBody.data.cover_image_url,
          /^https:\/\/images\.example\.test\//,
        );
        assert.equal('cover_image_url_expires_in' in companyBody.data, false);
        assert.equal(companyBody.data.cover_key, undefined);
        assert.equal(companyBody.data.logo_key, undefined);
        assert.deepEqual(signed, [{ key: data.images[0].object_key, seconds: 300 }]);

        const urlResponse = await fetch(
          `${baseUrl}/api/v1/storage/images/${body.data.imageId}/url`,
        );
        assert.equal(urlResponse.status, 200);
        const urlBody = await urlResponse.json();
        assert.equal(urlBody.data.expiresInSeconds, 300);
        assert.match(urlBody.data.url, /^https:\/\/images\.example\.test\//);
      },
    );

    await t.test(
      'Admin de outra empresa não altera nem envia objeto para R2',
      async () => {
        await reset();
        const response = await upload(multipart({ companyId: companyBId }));
        assert.equal(response.status, 403);
        assert.equal(uploaded.length, 0);
        assert.equal((await readData()).images.length, 0);
      },
    );

    await t.test(
      'Superadmin pode alterar capa de empresa existente sem vínculo empresarial',
      async () => {
        await reset();
        const response = await upload(
          multipart({ companyId: companyBId }),
          token(superAdminId),
        );
        assert.equal(response.status, 201);
        assert.equal((await readData()).images[0].resource_id, companyBId);
      },
    );

    await t.test(
      'Atendente, cliente, visitante e token antigo não fazem upload',
      async () => {
        await reset();
        assert.equal((await upload(multipart(), token(attendantId))).status, 403);
        assert.ok(
          [401, 403].includes((await upload(multipart(), token(customerId))).status),
        );
        assert.equal((await upload(multipart(), null)).status, 401);
        assert.equal((await upload(multipart(), token(adminId, true))).status, 401);
        assert.equal(uploaded.length, 0);
      },
    );

    await t.test(
      'Arquivo ausente, vazio, conteúdo inválido e MIME falsificado são rejeitados',
      async () => {
        await reset();
        assert.equal((await upload(multipart({ includeFile: false }))).status, 400);
        assert.equal(
          (await upload(multipart({ buffer: Buffer.alloc(0) }))).status,
          400,
        );
        assert.equal(
          (await upload(multipart({ buffer: Buffer.from('arquivo não é uma imagem') })))
            .status,
          400,
        );
        assert.equal((await upload(multipart({ mime: 'image/jpeg' }))).status, 400);
        assert.equal(uploaded.length, 0);
      },
    );

    await t.test(
      'Limite de dez milhões de bytes é aplicado antes de armazenar',
      async () => {
        await reset();
        const oversized = Buffer.alloc(10_000_001);
        png.copy(oversized);
        assert.equal((await upload(multipart({ buffer: oversized }))).status, 413);
        assert.equal(uploaded.length, 0);

        const atLimit = Buffer.alloc(10_000_000);
        png.copy(atLimit);
        assert.equal((await upload(multipart({ buffer: atLimit }))).status, 201);
      },
    );

    await t.test(
      'Finalidade desconhecida é rejeitada e empresa ausente retorna 404',
      async () => {
        await reset();
        assert.equal((await upload(multipart({ purpose: 'avatar' }))).status, 400);
        assert.equal(
          (await upload(multipart({ companyId: randomUUID() }), token(superAdminId)))
            .status,
          404,
        );
        assert.equal(uploaded.length, 0);
      },
    );

    await t.test(
      'Logo exige as mesmas permissões de capa e superadmin pode alterar outra empresa',
      async () => {
        await reset();
        assert.equal(
          (await upload(multipart({ purpose: 'logo', companyId: companyBId }))).status,
          403,
        );
        assert.equal(
          (await upload(multipart({ purpose: 'logo' }), token(attendantId))).status,
          403,
        );
        assert.equal(
          (await upload(multipart({ purpose: 'logo' }), token(customerId))).status,
          401,
        );
        assert.equal((await upload(multipart({ purpose: 'logo' }), null)).status, 401);
        assert.equal(
          (await upload(multipart({ purpose: 'logo' }), token(adminId, true))).status,
          401,
        );
        assert.equal(uploaded.length, 0);
        assert.equal(
          (
            await upload(
              multipart({ purpose: 'logo', companyId: companyBId }),
              token(superAdminId),
            )
          ).status,
          201,
        );
        const data = await readData();
        assert.equal(data.companies[1].logo_key, data.images[0].object_key);
        assert.match(data.images[0].object_key, /\/logo\//);
        assert.equal(data.images[0].purpose, 'logo');
      },
    );

    await t.test(
      'Logo e capa têm referências independentes e URLs públicas de cinco minutos',
      async () => {
        await reset();
        const cover = await (await upload()).json();
        const logo = await (await upload(multipart({ purpose: 'logo' }))).json();
        assert.equal(logo.data.target.purpose, 'logo');
        const data = await readData();
        const coverKey = data.companies[0].cover_key!;
        const logoKey = data.companies[0].logo_key!;
        assert.notEqual(coverKey, logoKey);
        assert.equal(data.images.length, 2);
        assert.equal(deleted.length, 0);
        const detail = await (
          await fetch(`${baseUrl}/api/v1/empresas/${companyAId}`)
        ).json();
        assert.match(
          detail.data.cover_image_url,
          new RegExp(encodeURIComponent(coverKey)),
        );
        assert.match(detail.data.logo, new RegExp(encodeURIComponent(logoKey)));
        assert.equal('logo_image_url' in detail.data, false);
        assert.equal(detail.data.cover_key, undefined);
        assert.equal(detail.data.logo_key, undefined);
        for (const id of [cover.data.imageId, logo.data.imageId]) {
          const response = await fetch(`${baseUrl}/api/v1/storage/images/${id}/url`);
          assert.equal(response.status, 200);
          assert.equal((await response.json()).data.expiresInSeconds, 300);
        }
        assert.ok(signed.every((entry) => entry.seconds === 300));
        assert.equal((await upload(multipart({ purpose: 'logo' }))).status, 201);
        const current = await readData();
        assert.equal(current.companies[0].cover_key, coverKey);
        assert.notEqual(current.companies[0].logo_key, logoKey);
        assert.ok(deleted.includes(logoKey));
        assert.ok(!deleted.includes(coverKey));
        assert.equal(
          (await fetch(`${baseUrl}/api/v1/storage/images/${logo.data.imageId}/url`))
            .status,
          404,
        );
        assert.equal(
          (await fetch(`${baseUrl}/api/v1/storage/images/${cover.data.imageId}/url`))
            .status,
          200,
        );
      },
    );

    await t.test(
      'Logo legada permanece como fallback sem chave e conteúdo inválido não a substitui',
      async () => {
        await reset();
        const data = fixture();
        Object.assign(data.companies[0], {
          logo: 'https://legacy.example.test/logo.png',
        });
        await writeFile(dataFile, JSON.stringify(data));
        const detail = await (
          await fetch(`${baseUrl}/api/v1/empresas/${companyAId}`)
        ).json();
        assert.equal(detail.data.logo, 'https://legacy.example.test/logo.png');
        assert.equal('logo_image_url' in detail.data, false);
        for (const options of [
          { includeFile: false },
          { buffer: Buffer.from('inválido') },
          { mime: 'image/jpeg' },
        ]) {
          assert.equal(
            (await upload(multipart({ ...options, purpose: 'logo' }))).status,
            400,
          );
        }
        assert.equal(uploaded.length, 0);
        assert.equal((await readData()).companies[0].logo_key, null);
      },
    );

    await t.test(
      'Chave de logo sem metadado compatível não expõe fallback legado nem assina imagem de capa',
      async () => {
        await reset();
        await upload();
        const stored = JSON.parse(await readFile(dataFile, 'utf8'));
        stored.companies[0].logo = 'https://legacy.example.test/logo.png';
        stored.companies[0].logo_key = stored.companies[0].cover_key;
        await writeFile(dataFile, JSON.stringify(stored));
        signed.length = 0;
        const detail = await (
          await fetch(`${baseUrl}/api/v1/empresas/${companyAId}`)
        ).json();
        assert.equal(detail.data.logo, null);
        assert.equal(signed.length, 1);
        assert.match(detail.data.cover_image_url, /^https:\/\/images\.example\.test\//);
      },
    );

    await t.test(
      'Falha ao atualizar logo compensa somente imagem nova e preserva capa e logo vigentes',
      async (context) => {
        await reset();
        await upload();
        await upload(multipart({ purpose: 'logo' }));
        const before = await readData();
        context.mock.method(companyRepository, 'updateLogoKey', async () => {
          throw new Error('Falha simulada na logo');
        });
        assert.equal((await upload(multipart({ purpose: 'logo' }))).status, 500);
        const after = await readData();
        assert.deepEqual(after.companies, before.companies);
        assert.equal(after.images.length, 2);
        assert.ok(deleted.includes(uploaded.at(-1)!));
        assert.ok(!deleted.includes(before.companies[0].logo_key!));
        assert.ok(!deleted.includes(before.companies[0].cover_key!));
      },
    );

    await t.test(
      'Substituições concorrentes de logo preservam vencedora e capa',
      { timeout: 8000 },
      async (context) => {
        await reset();
        await upload();
        await upload(multipart({ purpose: 'logo' }));
        const coverKey = (await readData()).companies[0].cover_key!;
        let arrivals = 0;
        let release!: () => void;
        const barrier = new Promise<void>((resolveBarrier) => {
          release = resolveBarrier;
        });
        context.mock.method(imageObjectStore, 'upload', async (key: string) => {
          uploaded.push(key);
          if (++arrivals === 2) {
            release();
          }
          await barrier;
        });
        const responses = await Promise.all([
          upload(multipart({ purpose: 'logo' })),
          upload(multipart({ purpose: 'logo' })),
        ]);
        assert.deepEqual(
          responses.map((response) => response.status).sort(),
          [201, 409],
        );
        const after = await readData();
        const winner = after.companies[0].logo_key!;
        assert.equal(after.companies[0].cover_key, coverKey);
        assert.ok(after.images.some((image) => image.object_key === winner));
        assert.ok(!deleted.includes(winner));
        assert.ok(!deleted.includes(coverKey));
      },
    );

    await t.test(
      'Uploads simultâneos de capa e logo não conflitam entre si',
      { timeout: 8000 },
      async (context) => {
        await reset();
        let arrivals = 0;
        let release!: () => void;
        const barrier = new Promise<void>((resolveBarrier) => {
          release = resolveBarrier;
        });
        context.mock.method(imageObjectStore, 'upload', async (key: string) => {
          uploaded.push(key);
          if (++arrivals === 2) {
            release();
          }
          await barrier;
        });
        const responses = await Promise.all([
          upload(),
          upload(multipart({ purpose: 'logo' })),
        ]);
        assert.deepEqual(
          responses.map((response) => response.status),
          [201, 201],
        );
        const after = await readData();
        assert.equal(after.images.length, 2);
        assert.ok(after.companies[0].cover_key);
        assert.ok(after.companies[0].logo_key);
        assert.deepEqual(deleted, []);
      },
    );

    await t.test(
      'Substituição confirma nova referência antes de excluir anterior e nega URL histórica',
      async () => {
        await reset();
        const firstResponse = await upload();
        const firstBody = await firstResponse.json();
        const oldKey = (await readData()).companies[0].cover_key!;

        assert.equal((await upload()).status, 201);
        const current = await readData();
        const currentKey = current.companies[0].cover_key;
        assert.notEqual(currentKey, oldKey);
        assert.ok(deleted.includes(oldKey));
        assert.ok(!deleted.includes(currentKey!));

        const previousUrl = await fetch(
          `${baseUrl}/api/v1/storage/images/${firstBody.data.imageId}/url`,
        );
        assert.equal(previousUrl.status, 404);
      },
    );

    await t.test(
      'Falha de upload preserva capa vigente e seu registro',
      async (context) => {
        await reset();
        assert.equal((await upload()).status, 201);
        const before = await readData();
        const oldKey = before.companies[0].cover_key;
        context.mock.method(imageObjectStore, 'upload', async () => {
          throw new Error('Falha simulada do R2');
        });

        assert.equal((await upload()).status, 500);
        const after = await readData();
        assert.equal(after.companies[0].cover_key, oldKey);
        assert.ok(after.images.some((image) => image.object_key === oldKey));
        assert.ok(!deleted.includes(oldKey!));
      },
    );

    await t.test(
      'Falha ao persistir metadados remove objeto novo e preserva capa anterior',
      async (context) => {
        await reset();
        assert.equal((await upload()).status, 201);
        const oldKey = (await readData()).companies[0].cover_key!;
        context.mock.method(storageRepository, 'create', async () => {
          throw new Error('Persistência de imagem simulada indisponível');
        });

        assert.equal((await upload()).status, 500);
        const after = await readData();
        assert.equal(after.companies[0].cover_key, oldKey);
        assert.equal(after.images.length, 1);
        assert.equal(after.images[0].object_key, oldKey);
        assert.ok(deleted.includes(uploaded.at(-1)!));
        assert.ok(!deleted.includes(oldKey));
      },
    );

    await t.test(
      'Falha na atualização da empresa compensa imagem nova sem apagar a vigente',
      async (context) => {
        await reset();
        assert.equal((await upload()).status, 201);
        const oldKey = (await readData()).companies[0].cover_key!;
        context.mock.method(companyRepository, 'updateCoverKey', async () => {
          throw new Error('Atualização da empresa simulada indisponível');
        });

        assert.equal((await upload()).status, 500);
        const after = await readData();
        assert.equal(after.companies[0].cover_key, oldKey);
        assert.equal(after.images.length, 1);
        assert.equal(after.images[0].object_key, oldKey);
        assert.ok(deleted.includes(uploaded.at(-1)!));
        assert.ok(!deleted.includes(oldKey));
      },
    );

    await t.test(
      'Falha ao excluir antiga não remove a nova capa confirmada',
      async (context) => {
        await reset();
        assert.equal((await upload()).status, 201);
        const oldKey = (await readData()).companies[0].cover_key;
        context.mock.method(imageObjectStore, 'delete', async () => {
          throw new Error('Exclusão simulada indisponível');
        });

        assert.equal((await upload()).status, 201);
        const after = await readData();
        assert.notEqual(after.companies[0].cover_key, oldKey);
        assert.ok(
          after.images.some(
            (image) => image.object_key === after.companies[0].cover_key,
          ),
        );
      },
    );

    await t.test(
      'Substituições concorrentes não excluem a capa vencedora',
      { timeout: 8000 },
      async (context) => {
        await reset();
        assert.equal((await upload()).status, 201);
        let arrivals = 0;
        let release!: () => void;
        const barrier = new Promise<void>((resolveBarrier) => {
          release = resolveBarrier;
        });
        context.mock.method(imageObjectStore, 'upload', async (key: string) => {
          uploaded.push(key);
          arrivals++;
          if (arrivals === 2) {
            release();
          }
          await barrier;
        });

        const responses = await Promise.all([upload(), upload()]);
        assert.deepEqual(
          responses.map((response) => response.status).sort(),
          [201, 409],
        );
        const after = await readData();
        const winner = after.companies[0].cover_key;
        assert.ok(after.images.some((image) => image.object_key === winner));
        assert.ok(!deleted.includes(winner!));
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolveClose, reject) => {
      server.close((error) => (error ? reject(error) : resolveClose()));
    });
    const resolvedRoot = resolve(temporaryRoot);
    assert.equal(dirname(resolvedRoot), resolve(tmpdir()));
    assert.ok(basename(resolvedRoot).startsWith('civix-storage-integration-'));
    await rm(resolvedRoot, { recursive: true });
  }
});
