import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

// Importação das rotas
import authRoutes from './routes/userRoute.ts';
import empresaRoutes from './routes/empresaRoute.ts';

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  return res.json({
    message: "API do Civix está rodando com sucesso!",
  });
});

app.use("/api/users", authRoutes);

app.use('/api/users', authRoutes);
app.use('/api/empresas', empresaRoutes);

// ===================================
// Inicialização do Servidor
// ===================================
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando com sucesso!");
  console.log(`📍 Acesse: http://localhost:${PORT}`);
});