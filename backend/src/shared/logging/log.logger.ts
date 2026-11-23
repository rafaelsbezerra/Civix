import pino, { type DestinationStream, type Logger } from 'pino';
import { once } from 'node:events';
import type { AppLogger, LogInput, LogLevel } from './log.contract.js';
import {
  sanitizeLogContext,
  sanitizeLogError,
  sanitizeLogText,
} from './log.sanitizer.js';

export interface LoggerOptions {
  destination?: DestinationStream;
  level?: LogLevel;
  pretty?: boolean;
}

const pinoLoggers = new WeakMap<AppLogger, Logger>();
let baseLogger: AppLogger | undefined;

export function createLogger(options: LoggerOptions = {}): AppLogger {
  const configuredLevel =
    options.level ??
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === 'development' ? 'debug' : 'info');
  if (!['debug', 'info', 'warn', 'error', 'fatal'].includes(configuredLevel)) {
    throw new Error('LOG_LEVEL deve ser debug, info, warn, error ou fatal.');
  }

  const pretty =
    !options.destination &&
    process.env.NODE_ENV === 'development' &&
    (options.pretty ?? true);
  const transport = pretty
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          messageKey: 'message',
          timestampKey: 'timestamp',
          colorize: process.stdout.isTTY === true,
        },
      })
    : undefined;
  const destination = options.destination ?? transport ?? process.stdout;
  const onError = () => {
    /* Uma falha do destino não deve interromper o fluxo de negócio. */
  };
  if ('on' in destination && typeof destination.on === 'function') {
    destination.on('error', onError);
  }

  const raw = pino(
    {
      base: null,
      level: configuredLevel,
      messageKey: 'message',
      timestamp: () => ',"timestamp":' + JSON.stringify(new Date().toISOString()),
      formatters: { level: (label) => ({ level: label }) },
      redact: {
        paths: [
          'context.password',
          'context.token',
          'context.email',
          'error.password',
          'error.token',
        ],
        censor: '[REMOVIDO]',
      },
    },
    destination,
  );

  function emit(level: LogLevel, input: LogInput) {
    try {
      const fields: Record<string, unknown> = {
        event: sanitizeLogText(input.event),
        module: input.module,
      };
      if (input.requestId) {
        fields.requestId = sanitizeLogText(input.requestId);
      }
      if (input.context) {
        fields.context = sanitizeLogContext(input.context);
      }
      if (input.http) {
        fields.http = {
          method: sanitizeLogText(input.http.method),
          route: sanitizeLogText(input.http.route),
          statusCode: input.http.statusCode,
        };
      }
      if ('error' in input) {
        fields.error = sanitizeLogError(input.error);
      }
      raw[level](fields, sanitizeLogText(input.message));
    } catch {
      // Falhas de formatação/escrita não substituem retorno ou exceção da aplicação.
    }
  }

  let closed = false;
  const logger: AppLogger = {
    debug: (input) => emit('debug', input),
    info: (input) => emit('info', input),
    warn: (input) => emit('warn', input),
    error: (input) => emit('error', input),
    fatal: (input) => emit('fatal', input),
    async close() {
      if (closed) {
        return;
      }
      closed = true;
      if (transport) {
        const closed = once(transport, 'close').catch(() => undefined);
        transport.end();
        await closed;
      }
      if (
        'removeListener' in destination &&
        typeof destination.removeListener === 'function'
      ) {
        destination.removeListener('error', onError);
      }
    },
  };
  pinoLoggers.set(logger, raw);
  return logger;
}

export function getBaseLogger(): AppLogger {
  return (baseLogger ??= createLogger());
}

export function getPinoLogger(logger: AppLogger): Logger | undefined {
  return pinoLoggers.get(logger);
}

export function createRequestLogger(logger: AppLogger, requestId: string): AppLogger {
  const bind = (level: LogLevel) => (input: LogInput) => {
    try {
      logger[level]({ ...input, requestId });
    } catch {
      // Preservar o fluxo de negócio quando o destino falhar.
    }
  };
  return {
    debug: bind('debug'),
    info: bind('info'),
    warn: bind('warn'),
    error: bind('error'),
    fatal: bind('fatal'),
    close: async () => {},
  };
}
