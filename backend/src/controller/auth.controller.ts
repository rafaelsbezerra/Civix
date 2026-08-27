// # Lógica de primeiro acesso e validação do token

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '../config/data';

interface JwtInvitePayload {
  email: string;
  role: 'empresa' | 'cliente';
}

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  invite_token: string | null;
}

export async function firstAccessController(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    // 1. Validação simples dos dados recebidos
    if (!token || !password) {
      return res.status(400).json({ error: 'Token e senha são obrigatórios.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha deve conter no mínimo 8 caracteres.' });
    }

    // 2. Valida o Token JWT
    const jwtSecret = process.env.JWT_INVITE_SECRET || 'secret-chave-civix';
    let decoded: JwtInvitePayload;

    try {
      decoded = jwt.verify(token, jwtSecret) as JwtInvitePayload;
    } catch (err) {
      return res.status(401).json({ error: 'Link de convite inválido ou expirado.' });
    }

    // 3. Busca o usuário no banco usando Raw SQL
    const userQuery = await db.query<UserRow>(
      'SELECT * FROM "user" WHERE email = $1',
      [decoded.email]
    );
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ error: 'Esta conta já foi ativada anteriormente.' });
    }

    if (user.invite_token !== token) {
      return res.status(401).json({ error: 'Este link de convite já foi utilizado ou é inválido.' });
    }

    // 4. Criptografa a nova senha (hash)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 5. Atualiza o registro no banco: grava a senha, ativa a conta e limpa o token via UPDATE SQL
    await db.query(
      `UPDATE "user" 
       SET password_hash = $1, status = $2, invite_token = $3 
       WHERE email = $4`,
      [hashedPassword, 'active', null, decoded.email]
    );

    return res.status(200).json({
      success: true,
      message: 'Senha cadastrada com sucesso! Sua conta está ativa.',
    });
  } catch (error: any) {
    console.error('Erro no controller de primeiro acesso:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar a criação de senha.',
    });
  }
}