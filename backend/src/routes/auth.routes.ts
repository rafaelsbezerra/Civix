// # Rota: POST /api/auth/first-access

import { Router } from 'express';
import { firstAccessController } from '../controller/auth.controller.js';

const authRouter = Router();

// Rota pública: qualquer pessoa com um token válido pode acessar
authRouter.post('/auth/first-access', firstAccessController);

export default authRouter;