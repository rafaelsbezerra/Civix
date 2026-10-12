import 'dotenv/config';
import { logger } from '../src/shared/logging/log.context.js';
import { createLogger } from '../src/shared/logging/log.logger.js';
import type { AppLogger } from '../src/shared/logging/log.contract.js';
import { createInterface } from 'node:readline/promises';
import { stdin, stderr } from 'node:process';

let commandLogger: AppLogger | undefined;

async function main(): Promise<void> {
  commandLogger = logger();
  const { USE_MOCK_DATA } = await import('../src/shared/config/data.js');

  if (!USE_MOCK_DATA) {
    throw new Error('Defina USE_MOCK_DATA=true antes de criar um usuário local.');
  }

  const { createMockUser } = await import('../src/services/mock.user.service.js');
  const input = createInterface({ input: stdin, output: stderr });

  try {
    const email = await input.question('E-mail do usuário local: ');
    const role = await input.question('Perfil (empresa ou cliente): ');
    const name = await input.question('Nome (opcional): ');
    const password = role === 'empresa'
      ? await input.question('Senha (mínimo de 8 caracteres): ')
      : undefined;
    await createMockUser({ email, role, name, password });
  } finally {
    input.close();
  }
}

main().catch(error => {
  commandLogger ??= createLogger({ level: 'info', pretty: false });
  commandLogger.error({
    event: 'mock.user-command.failed',
    module: 'mock',
    message: 'Não foi possível criar o usuário local',
    error,
  });
  process.exitCode = 1;
}).finally(async () => {
  await commandLogger?.close();
});
