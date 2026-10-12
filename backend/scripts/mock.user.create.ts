import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { createMockUser } from '../src/services/mock.user.service.js';
import { USE_MOCK_DATA } from '../src/shared/config/data.js';

async function main(): Promise<void> {
  if (!USE_MOCK_DATA) {
    throw new Error('Defina USE_MOCK_DATA=true antes de criar um usuário local.');
  }

  const input = createInterface({ input: stdin, output: stdout });

  try {
    const email = await input.question('E-mail do usuário local: ');
    const role = await input.question('Perfil (empresa ou cliente): ');
    const name = await input.question('Nome (opcional): ');
    const password = role === 'empresa'
      ? await input.question('Senha (mínimo de 8 caracteres): ')
      : undefined;
    const user = await createMockUser({ email, role, name, password });

    console.log('Usuário local criado:', user);
  } finally {
    input.close();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Não foi possível criar o usuário local.');
  process.exitCode = 1;
});