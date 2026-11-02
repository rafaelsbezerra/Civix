import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import { requireSuperAdmin } from '../middlewares/super.admin.js';
import * as planController from '../controller/plan.controller.js';
import * as companyController from '../controller/company.controller.js';

const router = Router();
router.use(authMiddleware, requireSuperAdmin);
router.post('/companies', companyController.createCompany);
router.get('/plans', planController.listPlatformPlans);
router.get('/plans/:planId', planController.getPlatformPlan);
router.post('/plans', planController.createPlatformPlan);
router.put('/plans/:planId', planController.updatePlatformPlan);
router.post('/plans/:planId/activation', planController.activatePlatformPlan);
export default router;
