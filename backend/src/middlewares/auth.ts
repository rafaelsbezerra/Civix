//Interceptadores (Autenticação, validação, logs)

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Interface para estender o Request do Express permitindo a propriedade userId
interface AuthenticatedRequest extends Request {
  userId?: string | number;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

  //Busca o token no cabeçalho da requisição
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  //Verifica se o token está no formato correto (Bearer <token>)
  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const [scheme, tokenValue] = tokenParts;

  //Verifica se o esquema é "Bearer"
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  try {

    //Verifica se o token é válido e decodifica o payload
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET as string) as JwtPayload;
    req.userId = decoded.id;
    next();

  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

export default authMiddleware;