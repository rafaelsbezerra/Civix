import type { RequestHandler } from 'express';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';

export const requireSuperAdmin: RequestHandler = (request, _response, next) => {
  const user = request.authenticatedUser;
  if (!user) return next(new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Usuário não autenticado.' }));
  if (user.role !== 'super_admin' || user.company_id !== null) {
    return next(new AppError({ status: 403, code: ErrorCode.FORBIDDEN, message: 'Acesso exclusivo da administração da Civix.' }));
  }
  next();
};
