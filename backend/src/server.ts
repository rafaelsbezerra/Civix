import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/userRoute.ts";

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

app.listen(PORT, () => {
  console.log("🚀 Servidor rodando com sucesso!");
  console.log(`📍 Acesse: http://localhost:${PORT}`);
});