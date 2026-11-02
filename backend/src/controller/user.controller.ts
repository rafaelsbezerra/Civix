import type { Request, Response } from 'express';
import * as userService from '../services/user.service.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { createSuccessResponse } from '../shared/contracts/response.contract.js';
import { isUserRole } from '../entities/user.entity.js';
import { SESSION_COOKIE, sessionCookieOptions } from '../config/cookies.js';

export async function login(req: Request, res: Response): Promise<Response> {
  const { email, password, role } = req.body ?? {};

  if (typeof email !== 'string' || !email.trim()) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Email é obrigatório',
    });
  }

  if (role !== undefined && !isUserRole(role)) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Tipo de usuário inválido',
    });
  }

  const { token, ...result } = await userService.login({ email, password, role });

  res.cookie(SESSION_COOKIE, token, sessionCookieOptions);

  return res.status(200).json(createSuccessResponse(result));
}

export function logout(_req: Request, res: Response): Response {
  const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions;
  res.clearCookie(SESSION_COOKIE, clearOptions);
  return res.status(200).json(createSuccessResponse({
    message: 'Logout realizado com sucesso.',
  }));
}

export async function forgotPassword(req: Request, res: Response): Promise<Response> {
  const { email } = req.body ?? {};

  if (!email) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'E-mail é obrigatório.',
    });
  }

  await userService.forgotPassword(email);

  return res.status(200).json(createSuccessResponse({
    message: 'Se o e-mail existir no sistema, as instruções serão enviadas.',
  }));
}

export async function resetPassword(req: Request, res: Response): Promise<Response> {
  const { token, password } = req.body ?? {};

  if (!token || !password) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Token e nova senha são obrigatórios.',
    });
  }

  if (password.length < 8) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'A senha deve ter no mínimo 8 caracteres.',
    });
  }

  await userService.resetPassword({ token, password });

  return res.status(200).json(createSuccessResponse({
    message: 'Senha redefinida com sucesso.',
  }));
}

export function profile(req: Request, res: Response): Response {
  const user = req.authenticatedUser!;
  return res.status(200).json(createSuccessResponse({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.company_id },
    permissions: { uploadCompanyCover: user.role === 'admin_empresa' || user.role === 'super_admin' },
  }));
}

export function home(req: Request, res: Response): Response {
  return res.status(200).json(createSuccessResponse({
    message: 'Acesso permitido à rota home',
    userId: req.userId,
    userRole: req.userRole,
  }));
}