import 'dotenv/config';
import { Client } from 'pg';
import { applyDatabaseReset, ResetError, resetSummary } from './lib/database.reset.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let apply = false;

  for (const arg of args) {
    if (arg === '--apply') {
      apply = true;
    } else {
      throw new ResetError('Argumentos inválidos. Use apenas --apply para confirmar.');
    }
  }

  console.log(
    JSON.stringify({
      mode: apply ? 'apply' : 'preview',
      ...resetSummary(),
    }),
  );

  if (!apply) {
    console.log(
      'Prévia concluída. Nenhuma conexão ou limpeza no banco foi realizada. Use --apply para executar.',
    );
    return;
  }

  const connectionString = process.env.DATABASE_URL || process.env.STAGING_DATABASE_URL;
  if (!connectionString) {
    throw new ResetError(
      'Defina DATABASE_URL (ou STAGING_DATABASE_URL) no .env para aplicar o reset.',
    );
  }

  const client = new Client({ connectionString, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await applyDatabaseReset(client);
    console.log(
      'Reset do banco confirmado. Os dados das tabelas de negócio foram limpos e _prisma_migrations foi preservada.',
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(
    error instanceof ResetError
      ? error.message
      : 'Não foi possível concluir o reset do banco. Verifique a conexão e as migrations aplicadas.',
  );
  process.exitCode = 1;
});
