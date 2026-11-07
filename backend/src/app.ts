import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from './routes/user.routes.js';
import firstAccessRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import planRoutes from './routes/plan.routes.js';
import storageRoutes from './routes/storage.routes.js';
import platformRoutes from './routes/platform.routes.js';
import { createSuccessResponse } from './shared/contracts/response.contract.js';
import { createLogMiddleware } from './middlewares/log.middleware.js';
import {
  createErrorHandler,
  createNotFoundHandler,
  terminateErroredResponse,
} from './middlewares/error.handler.js';

export const app = express();

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  app.set('trust proxy', 1);
}

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ??
  process.env.FRONTEND_URL ??
  'http://localhost:5173'
)
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(createLogMiddleware());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(compression());

app.get('/', (_req, res) => {
  return res.json(
    createSuccessResponse({
      message: 'API do Civix está rodando com sucesso!',
    }),
  );
});

const apiVersion = '/api/v1';

app.use(`${apiVersion}/users`, userRoutes);
app.use(`${apiVersion}/auth`, firstAccessRoutes);
app.use(`${apiVersion}/empresas`, companyRoutes);
app.use(`${apiVersion}/plans`, planRoutes);
app.use(`${apiVersion}/storage`, storageRoutes);
app.use(`${apiVersion}/platform`, platformRoutes);

app.use(createNotFoundHandler());
app.use(createErrorHandler());
app.use(terminateErroredResponse);
