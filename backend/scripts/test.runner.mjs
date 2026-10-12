import { spawn } from 'node:child_process';

const files = process.argv.slice(2);

if (!files.length) {
  throw new Error('Informe os arquivos da suíte de testes.');
}

// Testes SQL usam persistência simulada; o teste local define seu próprio modo.
const child = spawn(process.execPath, ['--import', 'tsx', '--test', ...files], {
  stdio: 'inherit',
  env: { ...process.env, USE_MOCK_DATA: 'false' },
});

child.on('error', error => {
  console.error('Não foi possível executar os testes:', error.message);
  process.exitCode = 1;
});

child.on('exit', code => {
  process.exitCode = code ?? 1;
});