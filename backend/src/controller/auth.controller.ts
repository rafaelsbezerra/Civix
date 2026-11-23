import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { createSuccessResponse } from '../shared/contracts/response.contract.js';

export async function validateTokenController(
  req: Request,
  res: Response,
): Promise<Response> {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Token de convite ausente.',
    });
  }

  const result = await authService.validateToken(token);

  return res.status(200).json(createSuccessResponse(result));
}

export async function firstAccessController(
  req: Request,
  res: Response,
): Promise<Response> {
  const { token, password } = req.body ?? {};

  if (
    typeof token !== 'string' ||
    !token ||
    typeof password !== 'string' ||
    !password
  ) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Token e senha são obrigatórios.',
    });
  }

  if (password.length < 8) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'A senha deve conter no mínimo 8 caracteres.',
    });
  }

  await authService.firstAccess(token, password);

  return res.status(200).json(
    createSuccessResponse({
      message: 'Senha cadastrada com sucesso! Sua conta está ativa.',
    }),
  );
}

export async function resendInviteEmailController(
  req: Request,
  res: Response,
): Promise<Response> {
  const { email } = req.body ?? {};

  if (typeof email !== 'string' || !email) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Email é obrigatório.',
    });
  }

  await authService.resendInviteEmail(email);

  return res.status(200).json(
    createSuccessResponse({
      message: 'Se o e-mail estiver cadastrado, um link de redefinição será enviado.',
    }),
  );
}
