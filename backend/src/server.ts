import 'dotenv/config';
import { createLogger, getBaseLogger } from './shared/logging/log.logger.js';

try {
  const logger = getBaseLogger();
  const { app } = await import('./app.js');
  const port = process.env.PORT ?? 3000;
  const server = app.listen(port, () => {
    logger.info({ event: 'server.started', module: 'server', message: 'Servidor rodando com sucesso',
      context: { port: Number(port) },
    });
  });
  server.on('error', error => {
    logger.fatal({ event: 'server.failed', module: 'server', message: 'Não foi possível iniciar o servidor', error });
    process.exitCode = 1;
  });
} catch (error) {
  const logger = createLogger({ level: 'info', pretty: false });
  logger.fatal({ event: 'server.failed', module: 'server', message: 'Não foi possível iniciar a aplicação', error });
  process.exitCode = 1;
}
