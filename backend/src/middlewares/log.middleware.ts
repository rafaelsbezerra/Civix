import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { Request, RequestHandler } from 'express';
import { pinoHttp } from 'pino-http';
import type { AppLogger, LogHttp } from '../shared/logging/log.contract.js';
import { createRequestLogger, getBaseLogger, getPinoLogger } from '../shared/logging/log.logger.js';
import { runWithLogContext } from '../shared/logging/log.context.js';

export function getLogHttp(request: Request, statusCode: number, durationMs?: number): LogHttp {
  const registeredPath = request.route?.path;
  const path = typeof registeredPath === 'string'
    ? registeredPath
    : Array.isArray(registeredPath)
      ? registeredPath.find((value: unknown) => typeof value === 'string') ?? 'unmatched'
      : 'unmatched';
  let prefix = path === 'unmatched' ? '' : request.baseUrl;
  for (const [key, value] of Object.entries(request.params ?? {})) {
    if (typeof value === 'string' && value) prefix = prefix.split(value).join(':' + key);
  }
  return { method: request.method, route: prefix + path, statusCode,
    ...(durationMs !== undefined ? { durationMs } : {}),
  };
}

export function createLogMiddleware(logger: AppLogger = getBaseLogger()): RequestHandler {
  const raw = getPinoLogger(logger);
  const httpLogger = raw ? pinoHttp({
    logger: raw, autoLogging: false,
    genReqId: () => randomUUID(), quietReqLogger: true, quietResLogger: true,
    wrapSerializers: false,
    serializers: { req: () => undefined, res: () => undefined, err: () => undefined },
  }) : undefined;

  return (request, response, next) => {
    let requestId: string = randomUUID();
    if (httpLogger) {
      try {
        // Impedir que um id anterior fornecido por outra camada substitua o UUID interno.
        request.id = undefined as unknown as string;
        httpLogger(request, response);
        requestId = String(request.id);
      } catch {
        // Uma falha do logger HTTP não deve impedir a requisição.
      }
    }
    const requestLogger = createRequestLogger(logger, requestId);
    const context = { requestId, logger: requestLogger, active: true };
    const startedAt = performance.now();
    let settled = false;

    function complete(aborted: boolean) {
      if (settled) return;
      settled = true;
      const level = aborted ? 'warn' : response.statusCode >= 500 ? 'error' : response.statusCode >= 400 ? 'warn' : 'info';
      requestLogger[level]({
        event: aborted ? 'http.request.aborted' : 'http.request.completed',
        module: 'http', message: aborted ? 'Requisição interrompida' : 'Requisição concluída',
        http: getLogHttp(request, response.statusCode, performance.now() - startedAt),
      });
      context.active = false;
    }

    response.once('finish', () => complete(false));
    response.once('close', () => complete(!response.writableFinished));
    runWithLogContext(context, next);
  };
}
