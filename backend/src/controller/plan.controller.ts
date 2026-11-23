import type { Request, Response } from 'express';
import * as planService from '../services/plan.service.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { createSuccessResponse } from '../shared/contracts/response.contract.js';

export async function listPlatformPlans(req: Request, res: Response) {
  return res.json(
    createSuccessResponse(
      await planService.listPlatformPlans(req.authenticatedUser!.id),
    ),
  );
}
export async function getPlatformPlan(req: Request, res: Response) {
  return res.json(
    createSuccessResponse(
      await planService.getPlatformPlan(
        req.authenticatedUser!.id,
        String(req.params.planId),
      ),
    ),
  );
}
export async function createPlatformPlan(req: Request, res: Response) {
  return res
    .status(201)
    .json(
      createSuccessResponse(
        await planService.savePlatformPlan(req.authenticatedUser!.id, req.body),
      ),
    );
}
export async function updatePlatformPlan(req: Request, res: Response) {
  return res.json(
    createSuccessResponse(
      await planService.savePlatformPlan(
        req.authenticatedUser!.id,
        req.body,
        String(req.params.planId),
      ),
    ),
  );
}
export async function activatePlatformPlan(req: Request, res: Response) {
  return res.json(
    createSuccessResponse(
      await planService.activatePlatformPlan(
        req.authenticatedUser!.id,
        String(req.params.planId),
        req.body,
      ),
    ),
  );
}

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

  if (req.userRole !== 'admin_empresa') {
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
