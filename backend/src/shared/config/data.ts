import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import type { QueryResultRow, PoolClient } from 'pg';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rawFlag = process.env.USE_MOCK_DATA ?? 'false';

if (rawFlag !== 'true' && rawFlag !== 'false') {
  throw new Error('USE_MOCK_DATA deve ser exatamente true ou false.');
}

export const USE_MOCK_DATA = rawFlag === 'true';
export const BACKEND_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
export const MOCK_DATA_DIR = resolve(
  BACKEND_ROOT,
  process.env.MOCK_DATA_DIR || '.local-data',
);

let pool: Pool | undefined;

function getPool(): Pool {
  if (USE_MOCK_DATA) {
    throw new Error('Consultas ao PostgreSQL não são permitidas no modo local.');
  }

  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });

  return pool;
}

export const db = {
  async transaction<T>(
    run: (client: Pick<PoolClient, 'query'>) => Promise<T>,
  ): Promise<T> {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await run(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  },
  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) {
    return getPool().query<T>(text, values);
  },
};
