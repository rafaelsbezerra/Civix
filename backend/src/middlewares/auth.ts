import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string | number;
      userRole?: string;
    }
  }
}

export default function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Token não fornecido.',
    }));
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return next(new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Erro no formato do token.',
    }));
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return next(new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Token mal formatado. Deve iniciar com Bearer.',
    }));
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new AppError({
      status: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Erro interno do servidor',
      details: { message: 'JWT_SECRET não definida nas variáveis de ambiente.' },
    }));
  }

  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(token, secret) as JwtPayload;
  } catch (cause) {
    return next(new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Token inválido ou expirado.',
      cause,
    }));
  }

  req.userId = decoded.id;

  if (decoded.role) {
    req.userRole = decoded.role;
  }

  next();
}
