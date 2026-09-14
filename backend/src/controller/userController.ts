import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../config/data.js";
import { sendForgotPasswordEmail } from "../services/mail.service.js";

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
        return res.status(400).json({
          error: "Senha é obrigatória para empresas",
        });
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
      return res.status(401).json({
        error: "Usuário não encontrado.",
      });
    }

    if (role === "empresa") {
      if (!user.password_hash) {
        return res.status(500).json({
          error: "Usuário da empresa não possui senha cadastrada.",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Senha incorreta.",
        });
      }
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "CRITICAL: JWT_SECRET não informada nas variáveis de ambiente."
      );

      return res.status(500).json({
        error: "Erro interno do servidor.",
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, secret, {
      expiresIn: "1h",
    });

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

    return res.status(500).json({
      error: "Erro interno do servidor",
    });
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

    if (!user) {
      console.log(`[FORGOT PASSWORD] E-mail ${email} não encontrado no banco.`);
      return res.status(200).json({
        message: "Se o e-mail existir no sistema, as instruções serão enviadas.",
      });
    }

    // 2. Gera token seguro em hexadecimal
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 3. Salva o token no banco definindo expiração via SQL (NOW() + 1 hora em UTC)
    const updateQuery = `
      UPDATE users 
      SET reset_password_token = $1, 
          reset_password_expires = NOW() + INTERVAL '1 hour'
      WHERE id = $2
    `;
    await db.query(updateQuery, [resetToken, user.id]);

    // 4. Dispara o e-mail via Brevo API
    try {
      await sendForgotPasswordEmail({
        email: user.email,
        token: resetToken,
      });
      console.log(`[FORGOT PASSWORD] E-mail enviado com sucesso via Brevo para ${user.email}`);
    } catch (emailError) {
      console.error("Erro ao disparar e-mail via Brevo:", emailError);
    }

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

    if (typeof token !== "string" || typeof password !== "string") {
      return res.status(400).json({
        error: "Token e nova senha são obrigatórios.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "A senha deve ter no mínimo 8 caracteres.",
      });
    }

    // 1. Busca o usuário apenas pelo token (sem filtro NOW() na query)
    const query = `
      SELECT id, reset_password_expires
      FROM users
      WHERE reset_password_token = $1
    `;

    const { rows } = await db.query<{ id: string | number; reset_password_expires: Date | string }>(
      query,
      [token]
    );

    const user = rows[0];

    // Se o token não existir na coluna reset_password_token
    if (!user) {
      console.warn(`[RESET PASSWORD] Token não localizado na tabela users: ${token}`);
      return res.status(400).json({
        error: "Token inválido ou expirado.",
      });
    }

    // 2. Valida se a data atual ultrapassou a expiração no Node.js
    if (user.reset_password_expires) {
      const expiresAt = new Date(user.reset_password_expires);
      const now = new Date();

      if (expiresAt < now) {
        console.warn(`[RESET PASSWORD] Token expirou. Expirava em: ${expiresAt.toISOString()}, Atual: ${now.toISOString()}`);
        return res.status(400).json({
          error: "Token expirado. Solicite um novo link de recuperação.",
        });
      }
    }

    // 3. Criptografa a nova senha
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Atualiza a senha e limpa o token
    const updateQuery = `
      UPDATE users
      SET password_hash = $1,
          reset_password_token = NULL,
          reset_password_expires = NULL
      WHERE id = $2
    `;

    await db.query(updateQuery, [passwordHash, user.id]);

    return res.status(200).json({
      message: "Senha redefinida com sucesso.",
    });
  } catch (error) {
    console.error("Erro em resetPassword:", error);

    return res.status(500).json({
      error: "Erro interno do servidor.",
    });
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