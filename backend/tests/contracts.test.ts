import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../src/errors/app.error.js';
import { serializeError, sanitizeDiagnostic } from '../src/contracts/error.contract.js';
import { parsePagination, createPaginationMeta } from '../src/contracts/pagination.contract.js';
import { createSuccessResponse, sendCreated, sendNoContent, sendSuccess, type ResponseWriter } from '../src/contracts/response.contract.js';
import { createErrorHandler, createNotFoundHandler } from '../src/middlewares/error.handler.js';
import express from 'express';
import { once } from 'node:events';

for (const environment of ['development', 'test', 'staging', 'preview', '']) {
  test(`diagnostic error in ${environment || 'unset'} includes stack and sanitized details`, () => {
    const error = new AppError({ status: 409, code: 'CONFLICT', message: 'Conflito', details: { password: 'private', nested: { token: 'private' }, field: 'name' }, cause: new Error('postgresql://user:private@localhost/db') });
    const body = serializeError(error, { environment, requestId: 'request-1' });
    assert.equal(body.status, 409);
    assert.equal(body.message, 'Conflito');
    assert.ok('stack' in body && body.stack?.includes('AppError'));
    assert.ok('requestId' in body && body.requestId === 'request-1');
    const json = JSON.stringify(body);
    assert.ok(json.includes('[REMOVIDO]'));
    assert.ok(json.includes('name'));
    assert.ok(!json.includes('private'));
  });
}

test('production has exactly status and message for classified and unexpected failures', () => {
  assert.deepEqual(serializeError(new AppError({ status: 400, code: 'VALIDATION_ERROR', message: 'Entrada inválida', details: { field: 'email' } }), { environment: 'production', requestId: 'secret' }), { status: 400, message: 'Entrada inválida' });
  for (const failure of [new Error('Detalhes internos do SQL'), 'unexpected', null, { status: 401, message: 'fake' }]) {
    assert.deepEqual(serializeError(failure, { environment: 'production' }), { status: 500, message: 'Erro interno do servidor' });
  }
});

test('diagnostics handle non-Error throws, circular data, accessors and sensitive strings', () => {
  const cycle: Record<string, unknown> = { authorization: 'Bearer private', message: 'password=private token="private"' };
  cycle.self = cycle;
  Object.defineProperty(cycle, 'getter', { enumerable: true, get() { throw new Error('Não deve ser executado'); } });
  const json = JSON.stringify(sanitizeDiagnostic(cycle));
  assert.ok(!json.includes('private'));
  assert.ok(json.includes('[Circular]'));
  assert.ok(json.includes('[Acessor]'));
  assert.equal(serializeError('failure', { environment: 'test' }).status, 500);
});

test('response helpers emit exact envelope and 201/204 status', () => {
  assert.deepEqual(createSuccessResponse([]), { data: [] });
  assert.deepEqual(createSuccessResponse(['a'], { page: 1 }), { data: ['a'], meta: { page: 1 } });
  let status = 0; let body: unknown; let ended = false;
  const response: ResponseWriter = { status(code) { status = code; return this; }, json(value) { body = value; }, end() { ended = true; } };
  sendSuccess(response, ['a']); assert.equal(status, 200); assert.deepEqual(body, { data: ['a'] });
  sendCreated(response, { id: '1' }); assert.equal(status, 201); assert.deepEqual(body, { data: { id: '1' } });
  body = undefined; sendNoContent(response); assert.equal(status, 204); assert.equal(body, undefined); assert.equal(ended, true);
});

test('pagination defaults, maximum, offset, empty, last and beyond final page', () => {
  assert.deepEqual(parsePagination({}), { page: 1, pageSize: 20, offset: 0 });
  assert.deepEqual(parsePagination({ page: '2', pageSize: '100' }), { page: 2, pageSize: 100, offset: 100 });
  assert.deepEqual(createPaginationMeta(parsePagination({}), 0), { page: 1, pageSize: 20, total: 0, totalPages: 0 });
  assert.deepEqual(createPaginationMeta(parsePagination({ page: 2 }), 21), { page: 2, pageSize: 20, total: 21, totalPages: 2 });
  assert.equal(createPaginationMeta(parsePagination({ page: 3 }), 21).totalPages, 2);
});

test('invalid pagination consistently raises 400 and rejects unsafe counts', () => {
  for (const value of [0, -1, 1.5, '', '0', '1.5', 'abc', null, [], {}, true, '9007199254740992']) {
    assert.throws(() => parsePagination({ page: value }), (error: unknown) => error instanceof AppError && error.status === 400);
  }
  assert.throws(() => parsePagination({ pageSize: 101 }), AppError);
  assert.throws(() => parsePagination({ page: Number.MAX_SAFE_INTEGER }), AppError);
  assert.throws(() => createPaginationMeta(parsePagination({}), -1), RangeError);
});

test('isolated Express app exercises production errors and unknown route without changing real bootstrap', async () => {
  const app = express();
  app.get('/failure', (_request, _response, next) => next(new Error('SQL privado')));
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ environment: 'production' }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const origin = `http://127.0.0.1:${address.port}`;
    const failure = await fetch(origin + '/failure');
    assert.equal(failure.status, 500);
    assert.deepEqual(await failure.json(), { status: 500, message: 'Erro interno do servidor' });
    const missing = await fetch(origin + '/missing');
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { status: 404, message: 'Recurso não encontrado' });
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});

test('quoted JSON secrets are redacted from messages and stack', () => {
  const error = new Error(JSON.stringify({ password: 'private', token: 'private', field: 'email' }));
  const body = serializeError(error, { environment: 'test' });
  assert.ok(!JSON.stringify(body).includes('private'));
  assert.ok(JSON.stringify(body).includes('email'));
});

test('Error and array accessors do not interrupt serialization', () => {
  const error = new Error('Falha');
  Object.defineProperty(error, 'cause', { get() { throw new Error('Não deve ser executado'); } });
  const body = serializeError(error, { environment: 'test' });
  assert.equal(body.status, 500);
  assert.ok(JSON.stringify(body).includes('[Acessor]'));
  const array: unknown[] = [null];
  Object.defineProperty(array, '0', { get() { throw new Error('Não deve ser executado'); } });
  assert.deepEqual(sanitizeDiagnostic(array), ['[Acessor]']);
  assert.ok('stack' in serializeError(null, { environment: 'test' }));
});

test('escaped quotes inside JSON secret values do not leak the remainder', () => {
  const error = new Error(JSON.stringify({ password: 'first"remainingSecret', token: 'line\\remainingSecret' }));
  const json = JSON.stringify(serializeError(error, { environment: 'test' }));
  assert.ok(!json.includes('remainingSecret'));
  assert.ok(!json.includes('first'));
});
