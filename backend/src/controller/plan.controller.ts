import type { Request, Response } from 'express';
import * as planService from '../services/plan.service.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { createSuccessResponse } from '../shared/contracts/response.contract.js';

export async function getPlans(_req: Request, res: Response): Promise<Response> {
  const plans = await planService.listActivePlans();

  return res.status(200).json(createSuccessResponse(plans));
}

export async function selectPlan(req: Request, res: Response): Promise<Response> {
  const { planId } = req.body ?? {};

  if (planId === undefined || planId === null || String(planId).trim() === '') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'planId e obrigatorio.',
    });
  }

  if (req.userId === undefined) {
    throw new AppError({
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Usuario nao autenticado.',
    });
  }

  if (req.userRole !== 'empresa') {
    throw new AppError({
      status: 403,
      code: ErrorCode.FORBIDDEN,
      message: 'Apenas empresas podem selecionar um plano.',
    });
  }

  const plan = await planService.assignPlanToUser(req.userId, String(planId));

  if (!plan) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Plano inexistente, inativo ou usuario nao encontrado.',
    });
  }

  return res.status(200).json(createSuccessResponse(plan));
}
