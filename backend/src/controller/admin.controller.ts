import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendInviteEmail } from '../services/mail.service';
import { db } from '../config/data';

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
}

export async function inviteUserController(req: Request, res: Response) {
  try {
    const { email, role } = req.body;

    // 1. Validação simples de entrada
    if (!email || !role) {
      return res.status(400).json({ error: 'E-mail e perfil (role) são obrigatórios.' });
    }

    if (role !== 'empresa' && role !== 'cliente') {
      return res.status(400).json({ error: 'Perfil inválido. Use "empresa" ou "cliente".' });
    }

    // 2. Verifica se o usuário já possui cadastro
    const existingUserQuery = await db.query<UserRow>(
      'SELECT * FROM "user" WHERE email = $1',
      [email]
    );
    const existingUser = existingUserQuery.rows[0];

    if (existingUser && existingUser.status === 'active') {
      return res.status(400).json({ error: 'Este e-mail já possui uma conta ativa no sistema.' });
    }

    // 3. Gera um token JWT com validade de 24 horas
    const jwtSecret = process.env.JWT_INVITE_SECRET || 'secret-chave-civix';
    const inviteToken = jwt.sign(
      { email, role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // 4. Salva ou atualiza o registro no banco com status 'pending'
    if (existingUser) {
      await db.query(
        `UPDATE "user" 
         SET role = $1, status = $2, invite_token = $3 
         WHERE email = $4`,
        [role, 'pending', inviteToken, email]
      );
    } else {
      await db.query(
        `INSERT INTO "user" (email, role, status, invite_token) 
         VALUES ($1, $2, $3, $4)`,
        [email, role, 'pending', inviteToken]
      );
    }

    // 5. Dispara o e-mail de convite
    await sendInviteEmail({ email, role, token: inviteToken });

    return res.status(201).json({
      success: true,
      message: 'Convite enviado por e-mail com sucesso!',
    });
  } catch (error: any) {
    console.error('Erro no controller de convite:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar e enviar o convite.',
    });
  }
}