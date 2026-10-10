import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { db } from '../config/data.js';
import * as mailService from './mail.service.js';
import type { User } from '../entities/user.entity.js';
import type { LoginInput, LoginResult, PasswordResetInput } from '../dtos/user.auth.dto.js';

export async function login({ email, role, password }: LoginInput): Promise<LoginResult> {
  if (role === 'empresa' && !password) return { success: false, reason: 'passwordRequired' };
  const query = role === 'empresa' ? `
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = $1 AND role = 'empresa'
      ` : `
        SELECT id, name, email, role
        FROM users
        WHERE email = $1 AND role = 'cliente'
      `;
  const { rows } = await db.query<User>(query, [email]);
  const user = rows[0];
  if (!user) return { success: false, reason: 'userNotFound' };
  if (role === 'empresa') {
    if (!user.password_hash) return { success: false, reason: 'passwordHashMissing' };
    if (!password) return { success: false, reason: 'passwordRequired' };
    if (!await bcrypt.compare(password, user.password_hash)) return { success: false, reason: 'invalidPassword' };
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('ERRO CRÍTICO: JWT_SECRET não informada nas variáveis de ambiente.');
    return { success: false, reason: 'jwtSecretMissing' };
  }
  const payload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
}

export async function forgotPassword(email: string): Promise<void> {
  const { rows } = await db.query<Pick<User, 'id' | 'name' | 'email'>>('SELECT id, name, email FROM users WHERE email = $1', [email]);
  const user = rows[0];
  // Não revelar se o endereço está cadastrado.
  if (!user) return;
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 3600000);
  await db.query(`
      UPDATE users
      SET reset_password_token = $1, reset_password_expires = $2
      WHERE id = $3
    `, [resetTokenHash, expiresAt, user.id]);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/redefinir-senha?token=${encodeURIComponent(resetToken)}`;
  await mailService.sendResetPasswordEmail({ email: user.email, resetUrl });
}

export async function resetPassword({ token, password }: PasswordResetInput): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const { rows } = await db.query<Pick<User, 'id'>>(`
      SELECT id
      FROM users
      WHERE reset_password_token = $1
      AND reset_password_expires > NOW()
    `, [tokenHash]);
  const user = rows[0];
  if (!user) return false;
  const passwordHash = await bcrypt.hash(password, 10);
  await db.query(`
      UPDATE users
      SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL
      WHERE id = $2
    `, [passwordHash, user.id]);
  return true;
}
