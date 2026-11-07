import type { ErrorRequestHandler, RequestHandler, Request } from 'express';
import {
  serializeError,
  type ErrorContext,
} from '../shared/contracts/error.contract.js';
import { AppError } from '../shared/errors/app.error.js';
import { logger } from '../shared/logging/log.context.js';
import { getLogHttp } from './log.middleware.js';
import { ErrorCode } from '../shared/errors/error.code.js';

function logRequestError(error: unknown, request: Request) {
  const status = error instanceof AppError ? error.status : 500;
  try {
    logger()[status < 500 ? 'warn' : 'error']({
      event: 'http.request.failed',
      module: 'http',
      message: 'Falha no processamento da requisição',
      error,
      http: getLogHttp(request, status),
    });
  } catch {
    // Logging não deve alterar o tratamento da exceção original.
  }
}

export function createErrorHandler(context: ErrorContext = {}): ErrorRequestHandler {
  return (error: unknown, request, response, next) => {
    if (response.headersSent) {
      logRequestError(error, request);
      next(error);
      return;
    }

    // O parser do Express identifica JSON inválido antes dos controllers.
    if (
      error instanceof SyntaxError &&
      'type' in error &&
      error.type === 'entity.parse.failed'
    ) {
      error = new AppError({
        status: 400,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'JSON inválido',
        cause: error,
      });
    }

    if (
      error instanceof Error &&
      'type' in error &&
      error.type === 'entity.too.large'
    ) {
      error = new AppError({
        status: 413,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Corpo da requisição excede o limite permitido',
        cause: error,
      });
    }

    logRequestError(error, request);
    const body = serializeError(error, context);

    response.status(body.status).json(body);
  };
}

export function createNotFoundHandler(): RequestHandler {
  return (_request, _response, next) => {
    next(
      new AppError({
        status: 404,
        code: ErrorCode.NOT_FOUND,
        message: 'Recurso não encontrado',
      }),
    );
  };
}

// Após o handler registrar e encaminhar o erro, fechar a conexão sem o console bruto do Express.
export const terminateErroredResponse: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  if (!response.headersSent) {
    next(error);
    return;
  }

  response.destroy();
};
