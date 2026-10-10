import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../config/data.js";
import { sendResetPasswordEmail } from "../services/mail.service.js";

interface DbUser {
  id: string | number;
  email: string;
  password_hash?: string;
  role: "empresa" | "cliente";
  name?: string;
}

export const login = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }

    if (role !== "empresa" && role !== "cliente") {
      return res.status(400).json({ error: "Tipo de usuário inválido" });
    }

    let query: string;
    let params: string[];

    if (role === "empresa") {
      if (!password) {
        return res.status(400).json({ error: "Senha é obrigatória para empresas" });
      }

      query = `
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = $1 AND role = 'empresa'
      `;
      params = [email];
    } else {
      query = `
        SELECT id, name, email, role
        FROM users
        WHERE email = $1 AND role = 'cliente'
      `;
      params = [email];
    }

    const { rows } = await db.query<DbUser>(query, params);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado." });
    }

    if (role === "empresa") {
      if (!user.password_hash) {
        return res.status(500).json({
          error: "Usuário da empresa não possui senha cadastrada.",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Senha incorreta." });
      }
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("CRITICAL: JWT_SECRET não informada nas variáveis de ambiente.");
      return res.status(500).json({ error: "Erro interno do servidor." });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório." });
    }

    // 1. Busca usuário na tabela utilizando PG Query
    const queryUser = `SELECT id, name, email FROM users WHERE email = $1`;
    const { rows } = await db.query<DbUser>(queryUser, [email]);
    const user = rows[0];

    // Por segurança, retorna 200 mesmo se o usuário não for encontrado
    // (evita ataques de enumeração de e-mails)
    if (!user) {
      return res.status(200).json({
        message: "Se o e-mail existir no sistema, as instruções serão enviadas.",
      });
    }

    // 2. Gera token seguro e data de expiração (1 hora)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora a partir de agora

    // 3. Salva o token no banco de dados
    const updateQuery = `
      UPDATE users 
      SET reset_password_token = $1, reset_password_expires = $2
      WHERE id = $3
    `;
    await db.query(updateQuery, [resetTokenHash, expiresAt, user.id]);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl.replace(/\/$/, "")}/redefinir-senha?token=${encodeURIComponent(resetToken)}`;

    await sendResetPasswordEmail({ email: user.email, resetUrl });

    return res.status(200).json({
      message: "Se o e-mail existir no sistema, as instruções serão enviadas.",
    });
  } catch (error) {
    console.error("Erro em forgotPassword:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token e nova senha são obrigatórios." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "A senha deve ter no mínimo 8 caracteres." });
    }

    // 1. Busca o usuário com token válido e não expirado
    const query = `
      SELECT id 
      FROM users 
      WHERE reset_password_token = $1 
      AND reset_password_expires > NOW()
    `;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { rows } = await db.query(query, [tokenHash]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: "Token inválido ou expirado." });
    }

    // 2. Criptografa a nova senha
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Atualiza a senha e limpa os campos de token
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL 
      WHERE id = $2
    `;
    await db.query(updateQuery, [passwordHash, user.id]);

    return res.status(200).json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    console.error("Erro em resetPassword:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export const home = (
  req: Request,
  res: Response
): Response => {
  const userId = req.userId;
  const userRole = req.userRole;

  return res.status(200).json({
    message: "Acesso permitido à rota home",
    userId,
    userRole,
  });
};