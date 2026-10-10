import type { ErrorRequestHandler, RequestHandler } from 'express';
import { serializeError, type ErrorContext } from '../contracts/error.contract.js';
import { AppError } from '../errors/app-error.js';

// Exported foundation only: not registered on the existing server.
export function createErrorHandler(context: ErrorContext = {}): ErrorRequestHandler {
  return (error: unknown, _request, response, next) => {
    if (response.headersSent) { next(error); return; }
    const body = serializeError(error, context);
    response.status(body.status).json(body);
  };
}

export function createNotFoundHandler(): RequestHandler {
  return (_request, _response, next) => {
    next(new AppError({ status: 404, code: 'NOT_FOUND', message: 'Recurso não encontrado' }));
  };
}
