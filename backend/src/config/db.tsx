import { Pool } from '@neondatabase/serverless';

// Garanta que DATABASE_URL esteja no seu arquivo .env
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});