import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import test from 'node:test';
import { createLogger, createRequestLogger } from '../src/shared/logging/log.logger.js';
import {
  logger as getLogger,
  runWithLogContext,
} from '../src/shared/logging/log.context.js';
import { AppError } from '../src/shared/errors/app.error.js';
import { ErrorCode } from '../src/shared/errors/error.code.js';

class MemoryDestination extends Writable {
  text = '';

  _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    this.text += chunk.toString();
    callback();
  }

  records(): Record<string, unknown>[] {
    return this.text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
}

function capture(level: 'debug' | 'info' | 'warn' | 'error' | 'fatal' = 'debug') {
  const destination = new MemoryDestination();
  const logger = createLogger({ destination, level, pretty: false });

  return { destination, logger };
}

test('Logger emite JSON canônico em todos os níveis sem metadados padrão do Pino', async () => {
  const { destination, logger } = capture();

  for (const level of ['debug', 'info', 'warn', 'error', 'fatal'] as const) {
    logger[level]({
      event: 'company.observed',
      module: 'companies',
      message: 'Empresa observada para diagnóstico.',
    });
  }

  await logger.close();
  const records = destination.records();

  assert.deepEqual(
    records.map((record) => record.level),
    ['debug', 'info', 'warn', 'error', 'fatal'],
  );
  for (const record of records) {
    assert.deepEqual(Object.keys(record).sort(), [
      'event',
      'level',
      'message',
      'module',
      'timestamp',
    ]);
    assert.equal(record.event, 'company.observed');
    assert.equal(record.module, 'companies');
    assert.equal(record.message, 'Empresa observada para diagnóstico.');
    assert.equal(new Date(String(record.timestamp)).toISOString(), record.timestamp);
    for (const field of [
      'schemaVersion',
      'service',
      'environment',
      'pid',
      'hostname',
      'msg',
      'requestId',
    ]) {
      assert.equal(field in record, false);
    }
  }
});

test('Filtro de nível não emite registros abaixo do nível selecionado', async () => {
  const { destination, logger } = capture('warn');
  const input = {
    event: 'http.observed',
    module: 'http' as const,
    message: 'Requisição observada.',
  };

  logger.debug(input);
  logger.info(input);
  logger.warn(input);
  logger.error(input);
  await logger.close();
  assert.deepEqual(
    destination.records().map((record) => record.level),
    ['warn', 'error'],
  );
});

test('Contexto assíncrono preserva o UUID após await sem herdar contexto fora da execução', async () => {
  const { destination, logger } = capture();
  const base = getLogger();
  const requestId = '71865dbe-8c54-4e77-b60c-40b881ca9ced';

  await runWithLogContext(
    { requestId, logger: createRequestLogger(logger, requestId), active: true },
    async () => {
      await Promise.resolve();
      getLogger().info({
        event: 'company.observed',
        module: 'companies',
        message: 'Empresa observada.',
        context: { companyId: 'company-internal', persistenceMode: 'json' },
      });
    },
  );

  assert.equal(getLogger(), base);
  logger.info({
    event: 'server.observed',
    module: 'server',
    message: 'Operação fora de requisição.',
  });
  await logger.close();
  const records = destination.records();

  assert.equal(records[0].requestId, requestId);
  assert.deepEqual(records[0].context, {
    companyId: 'company-internal',
    persistenceMode: 'json',
  });
  assert.equal('requestId' in records[1], false);
});

test('Sanitização cobre mensagens, stack, causa, URLs, e-mail e JWT sem executar acessores', async () => {
  const { destination, logger } = capture();
  const secret = 'credencial-sintetica-confidencial';
  const email = 'pessoa-confidencial@example.test';
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.abcdefghijklmnopqrstuv';
  const details: Record<string, unknown> = {
    password: secret,
    authorization: 'Bearer ' + jwt,
    query: 'SELECT * FROM users WHERE password = ' + secret,
    params: [email, secret],
    email,
  };
  details.self = details;
  let getterCalls = 0;
  Object.defineProperty(details, 'untrusted', {
    enumerable: true,
    get() {
      getterCalls++;
      throw new Error(secret);
    },
  });
  const cause = new Error(
    'Falha externa: https://example.test/reset?token=' + secret + '&email=' + email,
  );
  const error = new AppError({
    status: 500,
    code: ErrorCode.INTERNAL_ERROR,
    message:
      'Falha para ' + email + '; token=' + secret + '; Authorization: Bearer ' + jwt,
    details,
    cause,
  });

  logger.error({
    event: 'http.request.failed',
    module: 'http',
    message: 'Falha sanitizada para ' + email,
    error,
  });
  await logger.close();
  const output = destination.text;
  const record = destination.records()[0];

  assert.equal(getterCalls, 0);
  for (const sensitive of [secret, email, jwt]) {
    assert.equal(output.includes(sensitive), false);
  }
  assert.equal(record.level, 'error');
  assert.ok(record.error && typeof record.error === 'object');
  assert.ok('stack' in record.error);
  assert.ok('cause' in record.error);
});

test('Objetos lançados e acessores inseguros não interrompem a emissão', async () => {
  const { destination, logger } = capture();
  let getterCalls = 0;
  const value: Record<string, unknown> = {
    code: 'UNEXPECTED',
    token: 'segredo-sintetico',
  };
  value.self = value;
  Object.defineProperty(value, 'message', {
    enumerable: true,
    get() {
      getterCalls++;
      throw new Error('Acessor não permitido');
    },
  });

  assert.doesNotThrow(() =>
    logger.error({
      event: 'http.request.failed',
      module: 'http',
      message: 'Exceção sem instância de Error.',
      error: value,
    }),
  );
  await logger.close();
  assert.equal(getterCalls, 0);
  assert.equal(destination.records().length, 1);
  assert.equal(destination.text.includes('segredo-sintetico'), false);
});

test('Mensagens extensas não são truncadas por limite de registro', async () => {
  const { destination, logger } = capture();
  const message = 'Diagnóstico público: ' + 'x'.repeat(40_000);

  logger.info({ event: 'server.observed', module: 'server', message });
  await logger.close();
  assert.equal(destination.records()[0].message, message);
});

test('Falha síncrona do destino de log não substitui o resultado da operação', async () => {
  const logger = createLogger({
    destination: {
      write() {
        throw new Error('Destino indisponível');
      },
    },
    pretty: false,
  });

  assert.doesNotThrow(() =>
    logger.info({
      event: 'server.observed',
      module: 'server',
      message: 'Operação confirmada.',
    }),
  );
  await logger.close();
});

test('Contexto aceita somente campos permitidos e não executa getters nem registra payload livre', async () => {
  const { destination, logger } = capture();
  let getterCalls = 0;
  const context = {
    userId: 17,
    companyId: 'company-internal',
    role: 'admin_empresa' as const,
    persistenceMode: 'json' as const,
    count: 5,
    email: 'pessoa@example.test',
    body: { password: 'segredo-sintetico' },
    authorization: 'Bearer segredo-sintetico',
    name: 'Pessoa confidencial',
  };
  Object.defineProperty(context, 'operation', {
    enumerable: true,
    get() {
      getterCalls++;
      return 'segredo-sintetico';
    },
  });

  logger.info({
    event: 'company.observed',
    module: 'companies',
    message: 'Consulta confirmada.',
    context,
  });
  await logger.close();
  assert.deepEqual(destination.records()[0].context, {
    userId: 17,
    companyId: 'company-internal',
    role: 'admin_empresa',
    persistenceMode: 'json',
    count: 5,
  });
  assert.equal(getterCalls, 0);
  for (const sensitive of [
    'pessoa@example.test',
    'segredo-sintetico',
    'Pessoa confidencial',
  ]) {
    assert.equal(destination.text.includes(sensitive), false);
  }
});

test('Diagnóstico profundo mantém dados públicos e remove segredos sem limite arbitrário de profundidade', async () => {
  const { destination, logger } = capture();
  const details: Record<string, unknown> = {};
  let cursor = details;
  for (let index = 0; index < 128; index++) {
    const next: Record<string, unknown> = {};
    cursor.child = next;
    cursor = next;
  }
  cursor.publicMarker = 'diagnóstico público mais profundo';
  cursor.token = 'segredo-profundo-sintetico';

  logger.error({
    event: 'http.request.failed',
    module: 'http',
    message: 'Falha com diagnóstico profundo.',
    error: new AppError({
      status: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Falha interna.',
      details,
    }),
  });
  await logger.close();
  assert.equal(destination.records().length, 1);
  assert.equal(destination.text.includes('diagnóstico público mais profundo'), true);
  assert.equal(destination.text.includes('segredo-profundo-sintetico'), false);
  assert.equal(destination.text.includes('Limite de profundidade'), false);
});

test('Fechar logger é idempotente e preserva destino injetado pertencente ao chamador', async () => {
  const { destination, logger } = capture();

  logger.info({
    event: 'server.observed',
    module: 'server',
    message: 'Operação registrada.',
  });
  await logger.close();
  await logger.close();
  assert.equal(destination.writableEnded, false);
  assert.equal(destination.destroyed, false);
  assert.equal(destination.listenerCount('error'), 0);
  assert.equal(destination.records().length, 1);
});
