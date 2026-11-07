// # Rota: POST /api/admin/invite

import { Router } from 'express';
import { inviteUserController } from '../controller/admin.controller.js';

const adminRouter = Router();

// Rota protegida: apenas administradores devem ter acesso a esse endpoint
adminRouter.post('/admin/invite', /* requireAdmin, */ inviteUserController);

export default adminRouter;
