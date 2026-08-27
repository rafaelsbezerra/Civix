import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { db } from "../config/data";

interface DbUser {
  id: string | number;
  email: string;
  password_hash?: string;
  role: "empresa" | "cliente";
  name?: string;
}

interface AuthenticatedRequest extends Request {
  userId?: string | number;
  userRole?: string;
}

export const login = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email é obrigatório",
      });
    }

    if (role !== "empresa" && role !== "cliente") {
      return res.status(400).json({
        error: "Tipo de usuário inválido",
      });
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
        WHERE email = $1
        AND role = 'empresa'
      `;

      params = [email];
    } else {
      query = `
        SELECT id, name, email, role
        FROM users
        WHERE email = $1
        AND role = 'cliente'
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

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "default_secret",
      {
        expiresIn: "1h",
      }
    );

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

export const home = (
  req: AuthenticatedRequest,
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