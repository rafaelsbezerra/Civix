import type { ErrorRequestHandler, RequestHandler } from 'express';
import { serializeError, type ErrorContext } from '../shared/contracts/error.contract.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';

export function createErrorHandler(context: ErrorContext = {}): ErrorRequestHandler {
  return (error: unknown, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    // O parser do Express identifica JSON inválido antes dos controllers.
    if (error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed') {
      error = new AppError({
        status: 400,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'JSON inválido',
        cause: error,
      });
    }

    if (error instanceof Error && 'type' in error && error.type === 'entity.too.large') {
      error = new AppError({
        status: 413,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Corpo da requisição excede o limite permitido',
        cause: error,
      });
    }

    const body = serializeError(error, context);

    response.status(body.status).json(body);
  };
}

export function createNotFoundHandler(): RequestHandler {
  return (_request, _response, next) => {
    next(new AppError({
      status: 404,
      code: ErrorCode.NOT_FOUND,
      message: 'Recurso não encontrado',
    }));
  };
}
