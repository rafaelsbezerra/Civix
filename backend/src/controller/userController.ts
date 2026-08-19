// Lógica das requisições/respostas

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
// const User = require('../models/User');
import users from '../data/user.json';

// Estrutura do usuário para o JSON local
interface LocalUser {
    id: string | number;
    email: string;
    password?: string;
}

// Interface para estender o Request do Express com a propriedade userId
interface AuthenticatedRequest extends Request {
    userId?: string | number;
}

export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body;

        console.log('Email recebido:', email);
        console.log('Usuários:', users);

        //Validação de entrada
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }


        //Testando a infra com JSON local, sem banco de dados

        // 1. Busca o usuário no array do JSON (usando a interface LocalUser em vez de any)
        const user = (users as LocalUser[]).find((u) => u.email === email);

        console.log('Usuário encontrado:', user);
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // 2. Compara a senha enviada com o hash presente no JSON
        const isPasswordValid = await bcrypt.compare(password, user.password || '');
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        //Prepara o payload do token JWT
        const payload = {
            id: user.id,
            email: user.email,
        };

        //Gerar token JWT
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
            expiresIn: '1h' // O token expira em 1 hora
        });

        //Retorna o token para o cliente
        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
            },
            token,
        });


    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const home = (req: AuthenticatedRequest, res: Response): Response => {
    //Acessa o ID do usuário decodificado do token JWT
    const userId = req.userId;

    // Retorna informações sobre o usuário
    return res.status(200).json({
        message: 'Acesso permitido à rota home',
        userId,
    });
};