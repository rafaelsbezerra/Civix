import type { Request, Response } from 'express';
import * as adminService from '../services/admin.service.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { createSuccessResponse } from '../shared/contracts/response.contract.js';

export async function inviteUserController(req: Request, res: Response): Promise<Response> {
  const { email, role } = req.body ?? {};

  if (typeof email !== 'string' || !email || !role) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'E-mail e perfil (role) são obrigatórios.',
    });
  }

  if (role !== 'empresa' && role !== 'cliente') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Perfil inválido. Use "empresa" ou "cliente".',
    });
  }

  await adminService.inviteUser(email, role);

  return res.status(201).json(createSuccessResponse({
    message: 'Convite enviado por e-mail com sucesso!',
  }));
}