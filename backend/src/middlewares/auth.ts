import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedUser, AuthenticatedRole } from '../entities/user.entity.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { getAuthenticatedUser } from '../services/user.service.js';
import { SESSION_COOKIE, sessionCookieOptions } from '../config/cookies.js';

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

function extractToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[SESSION_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie) return fromCookie;

  const parts = req.headers.authorization?.split(' ');
  if (parts && parts.length === 2 && /^Bearer$/i.test(parts[0]) && parts[1]) return parts[1];

  return undefined;
}

export default async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Token ausente ou mal formatado.' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError({ status: 500, code: ErrorCode.INTERNAL_ERROR, message: 'Erro interno do servidor' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      if (typeof decoded !== 'object' || decoded.tokenVersion !== 2
        || (typeof decoded.id !== 'string' && typeof decoded.id !== 'number')
        || typeof decoded.email !== 'string' || typeof decoded.role !== 'string'
        || !Object.hasOwn(decoded, 'companyId')) {
        throw new Error('Claims de acesso inválidos ou legados.');
      }
    } catch (cause) {
      const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions;
      res.clearCookie(SESSION_COOKIE, clearOptions);
      throw new AppError({ status: 401, code: ErrorCode.UNAUTHORIZED, message: 'Token inválido ou expirado. Faça login novamente.', cause });
    }
    const user = await getAuthenticatedUser(String(decoded.id));
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