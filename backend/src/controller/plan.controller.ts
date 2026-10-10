import { Request, Response } from 'express';
import { assignPlanToUser, listActivePlans } from '../services/plan.service.js';

export async function getPlans(_req: Request, res: Response): Promise<Response> {
  try {
    const plans = await listActivePlans();
    return res.status(200).json({ success: true, data: plans, plans });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return res.status(500).json({ success: false, error: 'Erro interno ao buscar planos.' });
  }
}

export async function selectPlan(req: Request, res: Response): Promise<Response> {
  const { planId } = req.body as { planId?: string | number };

  if (planId === undefined || planId === null || String(planId).trim() === '') {
    return res.status(400).json({ success: false, error: 'planId e obrigatorio.' });
  }

  if (req.userId === undefined) {
    return res.status(401).json({ success: false, error: 'Usuario nao autenticado.' });
  }

  if (req.userRole !== 'empresa') {
    return res.status(403).json({ success: false, error: 'Apenas empresas podem selecionar um plano.' });
  }

  try {
    const plan = await assignPlanToUser(req.userId, String(planId));

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Plano inexistente, inativo ou usuario nao encontrado.',
      });
    }

    return res.status(200).json({ success: true, data: plan, plan });
  } catch (error) {
    console.error('Erro ao selecionar plano:', error);
    return res.status(500).json({ success: false, error: 'Erro interno ao selecionar plano.' });
  }
}
