import { Request, Response, Router } from 'express';
import { forgotPassword, home, login, resetPassword } from '../controller/userController.js';
import authMiddleware from '../middlewares/auth.js';

const router: Router = Router();

// Rota pública de login
router.post('/login', login);

// Rotas públicas de recuperação de senha
router.post(['/forgot-password', '/esqueci-senha'], forgotPassword);
router.post(['/reset-password', '/redefinir-senha'], resetPassword);

// Rota protegida de perfil
router.get('/profile', authMiddleware, (req: Request, res: Response) => {
  return res.json({
    message: 'Acesso permitido à rota protegida',
    userId: req.userId, // Acessado diretamente graças à tipagem estendida do Express
  });
});

// Rota protegida home
router.post('/home', authMiddleware, home);

export default router;