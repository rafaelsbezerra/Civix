import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { createSuccessResponse } from '../shared/contracts/response.contract.js';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendInviteEmail } from '../services/mail.service.js';
import { db } from '../shared/config/data.js';

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
}

export async function inviteUserController(req: Request, res: Response) {
  const { email, role } = req.body ?? {};

  // 1. Validação simples de entrada
  if (!email || !role) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'E-mail e perfil (role) são obrigatórios.',
    });
  }

  if (role !== 'empresa' && role !== 'cliente') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Perfil inválido. Use "empresa" ou "cliente".',
    });
  }

  // 2. Verifica se o usuário já possui cadastro
  const existingUserQuery = await db.query<UserRow>(
    'SELECT * FROM "user" WHERE email = $1',
    [email]
  );
  const existingUser = existingUserQuery.rows[0];

  if (existingUser && existingUser.status === 'active') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Este e-mail já possui uma conta ativa no sistema.',
    });
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

  return res.status(201).json(createSuccessResponse({
    message: 'Convite enviado por e-mail com sucesso!',
  }));
}