import { AsyncLocalStorage } from 'node:async_hooks';
import type { AppLogger } from './log.contract.js';
import { getBaseLogger } from './log.logger.js';

export interface RequestLogContext {
  requestId: string;
  logger: AppLogger;
  active: boolean;
}

const contexts = new AsyncLocalStorage<RequestLogContext>();

export function runWithLogContext<T>(context: RequestLogContext, callback: () => T): T {
  return contexts.run(context, callback);
}

export function logger(): AppLogger {
  const context = contexts.getStore();
  return context?.active ? context.logger : getBaseLogger();
}
