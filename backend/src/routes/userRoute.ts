import { Request, Response, Router } from 'express';
import { login, home } from '../controller/userController.js';
import authMiddleware from '../middlewares/auth.js';

const router: Router = Router();

// Rota pública de login
router.post('/login', login);

// Rota pública de recuperação de senha
router.post('/esqueci-senha', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'O e-mail é obrigatório.' });
    }

    // TODO: Implementar a lógica de busca do usuário, geração do token e envio de e-mail

    return res.status(200).json({
      message: 'Se o e-mail estiver cadastrado, você receberá as instruções de redefinição.',
    });
  } catch (error) {
    console.error('Erro em forgot-password:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

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