import type { Request, Response } from 'express';
import * as userService from '../services/user.service.js';

export async function login(req: Request, res: Response): Promise<Response> {
  try {
    const { email, password, role } = req.body;

    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

    if (role !== 'empresa' && role !== 'cliente') return res.status(400).json({ error: 'Tipo de usuário inválido' });

    if (role === 'empresa' && !password) return res.status(400).json({ error: 'Senha é obrigatória para empresas' });

    const result = await userService.login({ email, password, role });

    if (result.success) return res.status(200).json({ user: result.user, token: result.token });

    switch (result.reason) {
      case 'userNotFound': return res.status(401).json({ error: 'Usuário não encontrado.' });
      case 'passwordRequired': return res.status(400).json({ error: 'Senha é obrigatória para empresas' });
      case 'passwordHashMissing': return res.status(500).json({ error: 'Usuário da empresa não possui senha cadastrada.' });
      case 'invalidPassword': return res.status(401).json({ error: 'Senha incorreta.' });
      case 'jwtSecretMissing': return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<Response> {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });

    await userService.forgotPassword(email);

    return res.status(200).json({ message: 'Se o e-mail existir no sistema, as instruções serão enviadas.' });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<Response> {
  try {
    const { token, password } = req.body;

    if (!token || !password) return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });

    if (password.length < 8) return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });

    if (!await userService.resetPassword({ token, password })) return res.status(400).json({ error: 'Token inválido ou expirado.' });

    return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

export function profile(req: Request, res: Response): Response {
  return res.json({ message: 'Acesso permitido à rota protegida', userId: req.userId });
}

export function home(req: Request, res: Response): Response {
  return res.status(200).json({ message: 'Acesso permitido à rota home', userId: req.userId, userRole: req.userRole });
}
