import assert from 'node:assert/strict';
import { once } from 'node:events';
import { get as getHttp } from 'node:http';
import { Writable } from 'node:stream';
import test from 'node:test';
import express, { type Express } from 'express';
import { createLogger } from '../src/shared/logging/log.logger.js';
import { logger as getLogger } from '../src/shared/logging/log.context.js';
import { createLogMiddleware } from '../src/middlewares/log.middleware.js';
import {
  createErrorHandler,
  createNotFoundHandler,
  terminateErroredResponse,
} from '../src/middlewares/error.handler.js';
import { AppError } from '../src/shared/errors/app.error.js';
import { ErrorCode } from '../src/shared/errors/error.code.js';

type RecordLine = {
  event: string;
  level: string;
  requestId?: string;
  context?: Record<string, unknown>;
  http?: { method: string; route: string; statusCode: number };
  error?: Record<string, unknown>;
};
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
  records(): RecordLine[] {
    return this.text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
}
function setup() {
  const destination = new MemoryDestination();
  const logger = createLogger({ destination, pretty: false, level: 'debug' });
  const app = express();
  app.use(createLogMiddleware(logger));
  app.use(express.json());
  return { app, destination, logger };
}
async function withServer(app: Express, run: (origin: string) => Promise<void>) {
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    await run('http://127.0.0.1:' + address.port);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test('Logs HTTP geram UUID interno, normalizam rota e preservam resposta sem novo header', async () => {
  const { app, destination, logger } = setup();
  const router = express.Router();
  router.get('/:id', (_req, res) => {
    getLogger().info({
      event: 'company.observed',
      module: 'companies',
      message: 'Empresa consultada.',
      context: { companyId: 'company-internal' },
    });
    res.json({ data: { nome: 'Empresa de teste' } });
  });
  app.use('/api/v1/empresas', router);
  const secret = 'token-sintetico-privado';
  await withServer(app, async (origin) => {
    const response = await fetch(
      origin + '/api/v1/empresas/pessoa@example.test?token=' + secret,
      {
        headers: {
          Authorization: 'Bearer ' + secret,
          Cookie: 'session=' + secret,
          'X-Request-ID': '00000000-0000-4000-8000-000000000000',
        },
      },
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { nome: 'Empresa de teste' } });
    assert.equal(
      [...response.headers.keys()].some((key) =>
        /^(?:x-)?(?:request|correlation)-id$/i.test(key),
      ),
      false,
    );
  });
  await logger.close();
  const records = destination.records();
  const completed = records.filter(
    (record) => record.event === 'http.request.completed',
  );
  assert.equal(completed.length, 1);
  assert.match(completed[0].requestId!, uuid);
  assert.notEqual(completed[0].requestId, '00000000-0000-4000-8000-000000000000');
  assert.ok(completed[0].http?.route.includes('/:id'));
  assert.equal(completed[0].http?.method, 'GET');
  assert.equal(completed[0].http?.statusCode, 200);
  assert.equal(
    records.find((record) => record.event === 'company.observed')?.requestId,
    completed[0].requestId,
  );
  for (const value of [secret, 'pessoa@example.test', 'Bearer', 'session=']) {
    assert.equal(destination.text.includes(value), false);
  }
});

test('Requisições concorrentes não misturam contexto após await', async () => {
  const { app, destination, logger } = setup();
  app.get('/concurrent/:id', async (req, res) => {
    const companyId = req.params.id;
    getLogger().debug({
      event: 'company.started',
      module: 'companies',
      message: 'Consulta iniciada.',
      context: { companyId },
    });
    await new Promise((resolve) => setTimeout(resolve, companyId === 'first' ? 30 : 5));
    getLogger().debug({
      event: 'company.finished',
      module: 'companies',
      message: 'Consulta finalizada.',
      context: { companyId },
    });
    res.json({ data: true });
  });
  await withServer(app, async (origin) => {
    const responses = await Promise.all(
      ['first', 'second'].map((id) => fetch(origin + '/concurrent/' + id)),
    );
    for (const response of responses) {
      assert.deepEqual(await response.json(), { data: true });
    }
  });
  await logger.close();
  const records = destination.records();
  const first = records.filter((record) => record.context?.companyId === 'first');
  const second = records.filter((record) => record.context?.companyId === 'second');
  assert.equal(first.length, 2);
  assert.equal(second.length, 2);
  assert.equal(first[0].requestId, first[1].requestId);
  assert.equal(second[0].requestId, second[1].requestId);
  assert.notEqual(first[0].requestId, second[0].requestId);
  assert.match(first[0].requestId!, uuid);
  assert.match(second[0].requestId!, uuid);
});

test('Contexto encerrado não acompanha trabalho assíncrono tardio', async () => {
  const { app, logger } = setup();
  const base = getLogger();
  let resolveLate!: (value: unknown) => void;
  const late = new Promise((resolve) => {
    resolveLate = resolve;
  });
  app.get('/late', (_req, res) => {
    setTimeout(() => resolveLate(getLogger()), 30);
    res.json({ data: true });
  });
  await withServer(app, async (origin) => {
    assert.deepEqual(await (await fetch(origin + '/late')).json(), { data: true });
    assert.equal(await late, base);
  });
  await logger.close();
});

for (const environment of ['production', 'staging']) {
  test(
    'Erro e parser preservam contrato HTTP e diagnóstico único em ' + environment,
    async () => {
      const { app, destination, logger } = setup();
      app.get('/failure', () => {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Conflito de operação.',
          cause: new Error('Falha para pessoa@example.test; token=segredo-sintetico'),
        });
      });
      app.post('/json', (_req, res) => res.json({ data: true }));
      app.use(createNotFoundHandler());
      app.use(createErrorHandler({ environment }));
      await withServer(app, async (origin) => {
        const failure = await fetch(origin + '/failure');
        const body = await failure.json();
        assert.equal(failure.status, 409);
        if (environment === 'production') {
          assert.deepEqual(body, { status: 409, message: 'Conflito de operação.' });
        } else {
          assert.equal(body.status, 409);
          assert.equal(body.code, ErrorCode.CONFLICT);
          assert.equal(typeof body.stack, 'string');
          assert.equal('requestId' in body, false);
        }
        const parser = await fetch(origin + '/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{ JSON inválido',
        });
        const parsed = await parser.json();
        assert.equal(parser.status, 400);
        assert.equal(parsed.message, 'JSON inválido');
        if (environment === 'production') {
          assert.deepEqual(parsed, { status: 400, message: 'JSON inválido' });
        }
      });
      await logger.close();
      const records = destination.records();
      const failures = records.filter(
        (record) => record.event === 'http.request.failed',
      );
      const completions = records.filter(
        (record) => record.event === 'http.request.completed',
      );
      assert.equal(failures.length, 2);
      assert.equal(completions.length, 2);
      assert.ok(
        failures.every((record) => record.level === 'warn' && record.error?.stack),
      );
      assert.ok(completions.every((record) => !record.error));
      assert.equal(destination.text.includes('pessoa@example.test'), false);
      assert.equal(destination.text.includes('segredo-sintetico'), false);
    },
  );
}

test('Headers já enviados encaminham o erro original sem responder novamente', async () => {
  const { app, destination, logger } = setup();
  const original = new Error('Falha após iniciar resposta');
  let forwarded: unknown;
  app.get('/started', (_req, res, next) => {
    res.write('início');
    next(original);
  });
  app.use(createErrorHandler({ environment: 'production' }));
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      forwarded = error;
      res.end(' fim');
    },
  );
  await withServer(app, async (origin) => {
    const response = await fetch(origin + '/started');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'início fim');
  });
  await logger.close();
  assert.equal(forwarded, original);
  assert.equal(
    destination.records().filter((record) => record.event === 'http.request.failed')
      .length,
    1,
  );
});

test('Conexão abortada emite somente aborted, sem completed duplicado', async () => {
  const { app, destination, logger } = setup();
  app.get('/abort', (_req, res) => {
    res.write('parcial');
  });
  await withServer(app, async (origin) => {
    await new Promise<void>((resolve, reject) => {
      const request = getHttp(origin + '/abort', (response) => {
        response.once('data', () => response.destroy());
        response.once('close', resolve);
      });
      request.once('error', reject);
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  await logger.close();
  const records = destination.records();
  assert.equal(
    records.filter((record) => record.event === 'http.request.aborted').length,
    1,
  );
  assert.equal(
    records.filter((record) => record.event === 'http.request.completed').length,
    0,
  );
});

test('Destino de log quebrado não muda sucesso ou erro original da API', async () => {
  const logger = createLogger({
    destination: {
      write() {
        throw new Error('Falha simulada de logging');
      },
    },
    pretty: false,
  });
  const app = express();
  app.use(createLogMiddleware(logger));
  app.get('/ok', (_req, res) => res.json({ data: true }));
  app.get('/bad', () => {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Dados inválidos.',
    });
  });
  app.use(createErrorHandler({ environment: 'production' }));
  await withServer(app, async (origin) => {
    assert.deepEqual(await (await fetch(origin + '/ok')).json(), { data: true });
    const response = await fetch(origin + '/bad');
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      status: 400,
      message: 'Dados inválidos.',
    });
  });
  await logger.close();
});

test('Rota desconhecida usa marcador genérico sem registrar caminho, query ou identificador concreto', async () => {
  const { app, destination, logger } = setup();
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ environment: 'production' }));

  await withServer(app, async (origin) => {
    const response = await fetch(
      origin + '/nao-existe/pessoa@example.test?token=segredo-sintetico',
    );
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ['message', 'status']);
  });
  await logger.close();
  const records = destination.records();
  assert.equal(records.length, 2);
  assert.ok(
    records.every(
      (record) => record.http?.route === 'unmatched' && record.http.statusCode === 404,
    ),
  );
  assert.ok(records.every((record) => record.level === 'warn'));
  for (const sensitive of ['pessoa@example.test', 'segredo-sintetico', 'nao-existe']) {
    assert.equal(destination.text.includes(sensitive), false);
  }
});

test('Falha inesperada mantém resposta 500 de produção e stack/causa sanitizadas somente no log interno', async () => {
  const { app, destination, logger } = setup();
  const original = new Error(
    'Falha externa para pessoa@example.test; token=segredo-sintetico',
    {
      cause: new Error('postgresql://usuario:senha-sintetica@localhost:5432/banco'),
    },
  );
  app.get('/unexpected', () => {
    throw original;
  });
  app.use(createErrorHandler({ environment: 'production' }));

  await withServer(app, async (origin) => {
    const response = await fetch(origin + '/unexpected');
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      status: 500,
      message: 'Erro interno do servidor',
    });
  });
  await logger.close();
  const records = destination.records();
  const failed = records.filter((record) => record.event === 'http.request.failed');
  const completed = records.filter(
    (record) => record.event === 'http.request.completed',
  );
  assert.equal(failed.length, 1);
  assert.equal(completed.length, 1);
  assert.equal(failed[0].level, 'error');
  assert.equal(completed[0].level, 'error');
  assert.equal(failed[0].error?.code, ErrorCode.INTERNAL_ERROR);
  assert.equal(failed[0].error?.status, 500);
  assert.equal(typeof failed[0].error?.stack, 'string');
  assert.ok(failed[0].error?.cause);
  assert.equal(completed[0].error, undefined);
  for (const sensitive of [
    'pessoa@example.test',
    'segredo-sintetico',
    'senha-sintetica',
    'postgresql://',
  ]) {
    assert.equal(destination.text.includes(sensitive), false);
  }
});

test('Aliases registrados em array mantêm a rota canônica sem registrar parâmetros concretos', async () => {
  const { app, destination, logger } = setup();
  app.get(['/catalogo/:id', '/empresas/:id'], (_req, res) => {
    res.json({ data: true });
  });

  await withServer(app, async (origin) => {
    for (const path of ['/catalogo/', '/empresas/']) {
      const response = await fetch(
        origin + path + 'pessoa@example.test?token=segredo-sintetico',
      );
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { data: true });
    }
  });
  await logger.close();

  const records = destination.records();
  assert.equal(records.length, 2);
  assert.ok(records.every((record) => record.event === 'http.request.completed'));
  assert.ok(records.every((record) => record.http?.route === '/catalogo/:id'));
  assert.equal(destination.text.includes('pessoa@example.test'), false);
  assert.equal(destination.text.includes('segredo-sintetico'), false);
});

test('Erro após headers em produção encerra a conexão sem stack bruto no console nem diagnóstico duplicado', async () => {
  const { app, destination, logger } = setup();
  app.set('env', 'production');
  const original = new Error('Falha para pessoa@example.test; token=segredo-sintetico');
  const originalConsoleError = console.error;
  let consoleErrorCalls = 0;
  let responseAborted = false;
  let partialBody = '';
  let responseStatus: number | undefined;

  app.get('/partial', (_req, res, next) => {
    res.write('conteúdo parcial');
    setTimeout(() => next(original), 20);
  });
  app.use(createErrorHandler({ environment: 'production' }));
  app.use(terminateErroredResponse);
  console.error = () => {
    consoleErrorCalls++;
  };

  try {
    await withServer(app, async (origin) => {
      await new Promise<void>((resolve, reject) => {
        const request = getHttp(origin + '/partial', (response) => {
          responseStatus = response.statusCode;
          response.setEncoding('utf8');
          response.on('data', (chunk) => {
            partialBody += chunk;
          });
          response.once('aborted', () => {
            responseAborted = true;
          });
          response.once('close', resolve);
        });
        request.once('error', reject);
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  } finally {
    console.error = originalConsoleError;
    await logger.close();
  }

  assert.equal(responseStatus, 200);
  assert.equal(partialBody, 'conteúdo parcial');
  assert.equal(responseAborted, true);
  assert.equal(consoleErrorCalls, 0);
  const records = destination.records();
  assert.equal(
    records.filter((record) => record.event === 'http.request.failed').length,
    1,
  );
  assert.equal(
    records.filter((record) => record.event === 'http.request.aborted').length,
    1,
  );
  assert.equal(
    records.filter((record) => record.event === 'http.request.completed').length,
    0,
  );
  assert.equal(destination.text.includes('pessoa@example.test'), false);
  assert.equal(destination.text.includes('segredo-sintetico'), false);

  let forwarded: unknown;
  terminateErroredResponse(
    original,
    {} as express.Request,
    { headersSent: false } as express.Response,
    (error) => {
      forwarded = error;
    },
  );
  assert.equal(forwarded, original);
});
