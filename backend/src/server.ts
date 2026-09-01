import "dotenv/config";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import compression from "compression"
import cors from "cors";
import helmet from "helmet";

// Importação das rotas
import authRoutes from './routes/userRoute.js';

const app = express();

const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(compression());
app.use(cors());

app.get("/", (_req: Request, res: Response) => {
  return res.json({
    message: "API do Civix está rodando com sucesso!",
  });
});

const apiVersion = "/api/v1";

app.use(`${apiVersion}/users`, authRoutes);
// app.use(`${apiVersion}/empresas`, empresaRoutes);

app.listen(PORT, () => {
  console.log("Servidor rodando com sucesso!");
  console.log(`Acesse: http://localhost:${PORT}`);
});