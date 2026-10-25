import assert from 'node:assert/strict';
import test from 'node:test';
import { S3Client } from '@aws-sdk/client-s3';
import { R2StorageService } from '../src/shared/integrations/cloudflare/r2.service.js';
import { AppError } from '../src/shared/errors/app.error.js';
import { ErrorCode } from '../src/shared/errors/error.code.js';
import { serializeError } from '../src/shared/contracts/error.contract.js';

function createClient() {
  return new S3Client({
    region: 'auto',
    endpoint: 'https://storage.example.invalid',
    credentials: { accessKeyId: 'test-access-key', secretAccessKey: 'test-secret-key' },
  });
}

function checkFailure(error: unknown, original: Error, message: string): boolean {
  assert.ok(error instanceof AppError);
  assert.equal(error.status, 500);
  assert.equal(error.code, ErrorCode.INTERNAL_ERROR);
  assert.equal(error.message, message);
  assert.equal(error.cause, original);
  assert.deepEqual(serializeError(error, { environment: 'production' }), {
    status: 500,
    message,
  });
  return true;
}

for (const operation of ['upload', 'delete'] as const) {
  test(`R2 ${operation} preserva causa e usa o erro público do projeto`, async context => {
    const client = createClient();
    const original = new Error('Falha técnica simulada do provedor');
    context.mock.method(client, 'send', async () => { throw original; });
    const storage = new R2StorageService(client, 'test-bucket');
    const message = operation === 'upload'
      ? 'Não foi possível armazenar o arquivo no Cloudflare R2.'
      : 'Não foi possível remover o arquivo do Cloudflare R2.';

    try {
      const request = operation === 'upload'
        ? storage.upload('companies/test/cover.png', Buffer.from('fixture'), 'image/png')
        : storage.delete('companies/test/cover.png');
      await assert.rejects(request, error => checkFailure(error, original, message));
    } finally {
      client.destroy();
    }
  });
}

test('R2 assinatura preserva falha de credenciais sem expor diagnóstico em produção', async () => {
  const original = new Error('Credenciais simuladas indisponíveis');
  const client = new S3Client({
    region: 'auto',
    endpoint: 'https://storage.example.invalid',
    credentials: async () => { throw original; },
  });

  try {
    const storage = new R2StorageService(client, 'test-bucket');
    await assert.rejects(storage.getPresignedUrl('cover.png', 300), error => checkFailure(
      error, original, 'Não foi possível gerar a URL temporária do arquivo.',
    ));
  } finally {
    client.destroy();
  }
});

test('R2 gera assinatura GET com validade de 300 segundos sem chamada de rede', async () => {
  const client = createClient();

  try {
    const storage = new R2StorageService(client, 'test-bucket');
    const result = new URL(await storage.getPresignedUrl('companies/test/cover.png', 300));
    assert.equal(result.searchParams.get('X-Amz-Expires'), '300');
    assert.ok(result.searchParams.has('X-Amz-Signature'));
    assert.match(result.pathname, /companies\/test\/cover\.png$/);
  } finally {
    client.destroy();
  }
});
