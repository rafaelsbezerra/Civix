import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedUser, AuthenticatedRole } from '../entities/user.entity.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { getAuthenticatedUser } from '../services/user.service.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string | number;
      userRole?: AuthenticatedRole;
      userCompanyId?: string | null;
      authenticatedUser?: AuthenticatedUser;
    }
  }
}

export default async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const parts = req.headers.authorization?.split(' ');
    if (!parts || parts.length !== 2 || !/^Bearer$/i.test(parts[0]) || !parts[1]) {
      throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Token ausente ou mal formatado.' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError({ status: 500, code: ErrorCode.INTERNAL_ERROR, message: 'Erro interno do servidor' });
    }
    let decoded;
    try {
      decoded = jwt.verify(parts[1], secret);
      if (typeof decoded !== 'object' || decoded.tokenVersion !== 2
        || (typeof decoded.id !== 'string' && typeof decoded.id !== 'number')
        || typeof decoded.email !== 'string' || typeof decoded.role !== 'string'
        || !Object.hasOwn(decoded, 'companyId')) {
        throw new Error('Claims de acesso inválidos ou legados.');
      }
    } catch (cause) {
      throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Token inválido ou expirado. Faça login novamente.', cause });
    }
    const user = await getAuthenticatedUser(decoded.id);
    if (user.tokens_revoked_at && (typeof decoded.issuedAt !== 'string'
      || !Number.isFinite(Date.parse(decoded.issuedAt))
      || Date.parse(decoded.issuedAt) <= new Date(user.tokens_revoked_at).getTime())) {
      throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Sessão revogada. Faça login novamente.' });
    }
    if (user.role !== decoded.role || user.company_id !== decoded.companyId
      || user.email.toLowerCase() !== decoded.email.toLowerCase()) {
      throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Acesso alterado. Faça login novamente.' });
    }
    req.userId = user.id;
    req.userRole = user.role;
    req.userCompanyId = user.company_id;
    req.authenticatedUser = user;
    next();
  } catch (error) {
    next(error);
  }
}
