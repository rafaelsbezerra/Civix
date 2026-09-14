// # Lógica de primeiro acesso e validação do token

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '../config/data.js';
import { sendForgotPasswordEmail } from '../services/mail.service.js';

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

// GET /api/v1/auth/validate-token?token=...
export const validateTokenController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Token de convite ausente." });
    }

    const query = `
      SELECT email, reset_password_expires 
      FROM users 
      WHERE reset_password_token = $1
    `;
    const { rows } = await db.query<{ email: string; reset_password_expires: Date | string }>(
      query,
      [token]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: "Este link de convite é inválido ou já foi utilizado." });
    }

    if (user.reset_password_expires) {
      const expiresAt = new Date(user.reset_password_expires);
      if (expiresAt < new Date()) {
        return res.status(400).json({ error: "Este link de convite expirou." });
      }
    }

    return res.status(200).json({ email: user.email });
  } catch (error) {
    console.error("Erro em validateTokenController:", error);
    return res.status(500).json({ error: "Erro interno ao validar o token." });
  }
};

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


export async function resendInviteEmailController(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    // 1. Procura o usuário pelo e-mail usando o driver pg (Pool)
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // Retorne status 200 de qualquer forma para evitar enumeração de e-mails.
    if (!user) {
      return res.status(200).json({
        message: 'Se o e-mail estiver cadastrado, um link de redefinição será enviado.',
      });
    }

    // 2. Gera um token temporário exclusivo para reset de senha (válido por 1h)
    const jwtSecret = process.env.JWT_RESET_SECRET || 'secret-reset-civix';
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // 3. Salva o token de redefinição no banco de dados usando pg Pool
    await db.query(
      'UPDATE users SET reset_password_token = $1 WHERE id = $2',
      [resetToken, user.id]
    );

    // 4. Dispara o e-mail
    await sendForgotPasswordEmail({ email: user.email, token: resetToken });

    return res.status(200).json({
      message: 'Se o e-mail estiver cadastrado, um link de redefinição será enviado.',
    });
  } catch (error) {
    console.error('Erro ao processar esqueci minha senha:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar a solicitação.',
    });
  }
}