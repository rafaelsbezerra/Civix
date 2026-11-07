import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import {
  applyStagingSeed,
  prepareStagingSeed,
  seedSummary,
  SeedError,
} from './lib/staging.seed.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  let source = resolve(
    backendRoot,
    process.env.MOCK_DATA_DIR || '.local-data',
    'data.json',
  );
  let apply = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--apply') {
      apply = true;
    } else if (
      args[index] === '--source' &&
      args[index + 1] &&
      !args[index + 1].startsWith('--')
    ) {
      source = resolve(args[++index]);
    } else {
      throw new SeedError(
        'Argumentos inválidos. Use --source arquivo.json e/ou --apply.',
      );
    }
  }
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(source, 'utf8'));
  } catch {
    throw new SeedError('Não foi possível ler o JSON de origem.');
  }
  const data = prepareStagingSeed(raw);
  console.log(
    JSON.stringify({ mode: apply ? 'apply' : 'preview', ...seedSummary(data) }),
  );
  if (!apply) {
    console.log(
      'Prévia concluída. Nenhuma conexão ou gravação no banco foi realizada.',
    );
    return;
  }
  const connectionString = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new SeedError(
      'Defina DATABASE_URL (ou STAGING_DATABASE_URL) no .env para aplicar.',
    );
  }
  const client = new Client({ connectionString, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await applyStagingSeed(client, data);
    console.log(
      'Seed confirmado no banco configurado no .env. Tokens e mensagens da outbox não foram importados.',
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  // Erros do driver podem incluir credenciais, SQL e dados pessoais.
  console.error(
    error instanceof SeedError
      ? error.message
      : 'Não foi possível concluir o seed. Verifique conexão, schema e conflitos; nenhum sucesso foi confirmado.',
  );
  process.exitCode = 1;
});
