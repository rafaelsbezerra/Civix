import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';

// Importação das rotas
import authRoutes from './routes/userRoute.ts';
import empresaRoutes from './routes/empresaRoute.ts';
// import userRoutes from './routes/userRoutes'; // Descomente quando criar outras rotas

const app = express();
const PORT = process.env.PORT || 3000;

// ===================================
// Middlewares Globais
// ===================================

// Permite requisições vindas de outros domínios (seu front-end React)
app.use(cors());

// Converte o corpo das requisições (req.body) para JSON
app.use(express.json());

// ===================================
// Rotas
// ===================================

// Rota de teste simples para verificar se a API está online
app.get('/', (req: Request, res: Response) => {
  return res.json({ message: 'API do Civix está rodando com sucesso!' });
});

// Registra as rotas de autenticação (/api/auth/login)
// app.use('/api/auth', authRoutes);

app.use('/api/users', authRoutes);
app.use('/api/empresas', empresaRoutes);

// ===================================
// Inicialização do Servidor
// ===================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando com sucesso!`);
  console.log(`📍 Acesse: http://localhost:${PORT}`);
});