import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Extensão de tipos nativa do Express (substitui AuthenticatedRequest)
declare global {
  namespace Express {
    interface Request {
      userId?: string | number;
      userRole?: string; // Opcional: útil para controle de permissões por perfil
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  // Validação e extração usando Regex limpa
  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Erro no formato do token.' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado. Deve iniciar com Bearer.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('CRITICAL: JWT_SECRET não definida nas variáveis de ambiente.');
    return res.status(500).json({ error: 'Erro interno no servidor de autenticação.' });
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Anexa os dados do usuário à requisição
    req.userId = decoded.id;
    if (decoded.role) {
      req.userRole = decoded.role;
    }

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

export default authMiddleware;