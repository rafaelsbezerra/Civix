import "dotenv/config";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";

// Importação das rotas
import userRoutes from './routes/user.routes.js';
import firstAccessRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import planRoutes from './routes/plan.routes.js';

const app = express();

const PORT = process.env.PORT ?? 3000;

// Configuração explícita de CORS
app.use(cors({
  origin: true, // Permite a origem da requisição (Vite/React em dev)
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(cookieParser());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

app.get("/", (_req: Request, res: Response) => {
  return res.json({
    message: "API do Civix está rodando com sucesso!",
  });
});

const apiVersion = "/api/v1";

app.use(`${apiVersion}/users`, userRoutes);
app.use('/api', firstAccessRoutes);
app.use(`${apiVersion}/empresas`, companyRoutes);
app.use(`${apiVersion}/plans`, planRoutes);

app.listen(PORT, () => {
  console.log("Servidor rodando com sucesso!");
  console.log(`Acesse: http://localhost:${PORT}`);
});