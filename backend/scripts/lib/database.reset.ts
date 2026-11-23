export interface ResetConnection {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export class ResetError extends Error {}

export const RESET_TARGET_TABLES = [
  'sales',
  'company_registration_operations',
  'images',
  'users',
  'companies',
  'plans',
] as const;

export function resetSummary() {
  return {
    tables: [...RESET_TARGET_TABLES],
    preservesMigrationsTable: '_prisma_migrations',
  };
}

export async function applyDatabaseReset(connection: ResetConnection): Promise<void> {
  await connection.query('BEGIN');
  try {
    await connection.query('SET LOCAL search_path TO public');

    const existingTables = await connection.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])`,
      [[...RESET_TARGET_TABLES]],
    );

    const foundNames = new Set(
      existingTables.rows.map((row) => String(row.table_name)),
    );
    const missing = RESET_TARGET_TABLES.filter((table) => !foundNames.has(table));

    if (missing.length > 0) {
      throw new ResetError(
        `Tabelas ausentes no banco (${missing.join(', ')}). Aplique as migrations antes de executar o reset.`,
      );
    }

    await connection.query(
      'TRUNCATE TABLE sales, company_registration_operations, images, users, companies, plans RESTART IDENTITY CASCADE',
    );

    await connection.query('COMMIT');
  } catch (error) {
    await connection.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}
