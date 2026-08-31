//Definição das rotas/endpoints

import express, { Request, Response, Router } from 'express';
import { login, home }  from '../controller/userController.js';
import authMiddleware from '../middlewares/auth.js';

const router: Router = express.Router();

console.log('login:', typeof login);
console.log('home:', typeof home);
console.log('authMiddleware:', typeof authMiddleware);

//Rota para o login
router.post('/login', login);

//Rota protegida que requer autenticação
router.get('/profile', authMiddleware, (req: Request, res: Response) => {
    res.json({
        //O payload decodificado está acessível via req.user
        message: 'Acesso permitido à rota protegida',
        userId: (req as { user?: { id?: string | number } }).user?.id
    });
});

//Rota home
router.post('/home', authMiddleware, home);

export default router;