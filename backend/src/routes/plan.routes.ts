import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import { getPlans, selectPlan } from '../controller/plan.controller.js';

const planRouter = Router();

planRouter.get('/', getPlans);
planRouter.post('/selection', authMiddleware, selectPlan);

export default planRouter;
