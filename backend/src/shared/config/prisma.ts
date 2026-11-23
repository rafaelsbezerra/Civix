import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { USE_MOCK_DATA } from './data.js';

let prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (USE_MOCK_DATA) {
    throw new Error('Consultas ao PostgreSQL não são permitidas no modo local.');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL deve ser informada quando USE_MOCK_DATA=false.');
  }

  prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  return prisma;
}
