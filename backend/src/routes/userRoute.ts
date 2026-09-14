import { Request, Response, Router } from 'express';
import { login, home, forgotPassword, resetPassword } from '../controller/userController.js';
import authMiddleware from '../middlewares/auth.js';

const router: Router = Router();

// Rota pública de login (/api/v1/users/login)
router.post('/login', login);

// Rota pública de solicitação de redefinição (/api/v1/users/esqueci-senha)
// Usa a função forgotPassword do controller que grava o token no DB e envia o e-mail via Brevo
router.post('/esqueci-senha', forgotPassword);

// Rota pública para redefinir a senha com o token (/api/v1/users/redefinir-senha)
router.post('/redefinir-senha', resetPassword);

// Rota protegida de perfil (/api/v1/users/profile)
router.get('/profile', authMiddleware, (req: Request, res: Response) => {
  return res.json({
    message: 'Acesso permitido à rota protegida',
    userId: req.userId,
  });
});

// Rota protegida home (/api/v1/users/home)
router.post('/home', authMiddleware, home);

export default router;