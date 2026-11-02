import type { Request, Response } from 'express';
import * as adminService from '../services/admin.service.js';
import { isAuthenticatedRole } from '../entities/user.entity.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { createSuccessResponse } from '../shared/contracts/response.contract.js';

export async function inviteUserController(req: Request, res: Response): Promise<Response> {
  const { email, role, companyId } = req.body ?? {};
  if (!req.authenticatedUser || (req.userRole !== 'super_admin' && req.userRole !== 'admin_empresa')) {
    throw new AppError({ status: 403, code: ErrorCode.FORBIDDEN, message: 'Sem permissão para convidar usuários.' });
  }
  if (typeof email !== 'string' || !email.trim() || !isAuthenticatedRole(role) || role === 'super_admin' || typeof companyId !== 'string') {
    throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'E-mail, perfil e empresa válidos são obrigatórios.' });
  }
  if (req.userRole === 'admin_empresa' && (role !== 'atendente' || req.userCompanyId !== companyId)) {
    throw new AppError({ status: 403, code: ErrorCode.FORBIDDEN, message: 'Sem permissão para esse convite.' });
  }
  await adminService.inviteUser(email, role, companyId);
  return res.status(201).json(createSuccessResponse({ message: 'Convite enviado com sucesso.' }));
}
