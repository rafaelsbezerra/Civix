import { AppError } from '../errors/app.error.js';
import { ErrorCode } from '../errors/error.code.js';
import { redactText } from '../contracts/error.contract.js';
import type { LogContext } from './log.contract.js';

const REDACTED = '[REMOVIDO]';
const sensitiveKey = /password|passwd|secret|token|authorization|cookie|credential|api[-_]?key|email|recipient|connection|query|sql|params|values|body|html|headers|cnpj|cpf|phone|address|^name$/i;

export function sanitizeLogText(value: string): string {
  return redactText(value)
    .replace(/\b(?:https?|postgres(?:ql)?|rediss?|mongodb(?:\+srv)?):\/\/[^\s<>"']+/gi, REDACTED)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, REDACTED)
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, REDACTED)
    .replace(/\b[a-f0-9]{32,}\b/gi, REDACTED)
    .replace(/\/(?:primeiro-acesso|redefinir-senha|validate-token)(?:\/[^\s?]*)?(?:\?[^\s]*)?/gi, REDACTED)
    .replace(/\b(?:SELECT\s+[^\n]*?\bFROM|INSERT\s+INTO|UPDATE\s+[^\n]*?\bSET|DELETE\s+FROM)\b[^\n]*/gi, '[SQL removido]');
}

function readProperty(value: object, key: string): unknown {
  let owner: object | null = value;
  const visited = new WeakSet<object>();
  while (owner) {
    if (visited.has(owner)) return '[Circular]';
    visited.add(owner);
    const descriptor = Object.getOwnPropertyDescriptor(owner, key);
    if (descriptor) {
      if ('value' in descriptor) return descriptor.value;
      // O V8 calcula stack por getter nativo; nunca executar getters do usuário.
      if (key === 'stack' && descriptor.get && Function.prototype.toString.call(descriptor.get).includes('[native code]')) {
        try {
          return descriptor.get.call(value);
        } catch {
          return '[Pilha indisponível]';
        }
      }
      return '[Acessor]';
    }
    owner = Object.getPrototypeOf(owner);
  }
  return undefined;
}

export function sanitizeLogDiagnostic(value: unknown): unknown {
  const holder: Record<string, unknown> = {};
  const pending: { value: unknown; parent: Record<string, unknown> | unknown[]; key: string | number }[] = [{ value, parent: holder, key: 'result' }];
  const visited = new WeakSet<object>();

  // Percorrer iterativamente evita limitar profundidade ou estourar a pilha do sanitizador.
  while (pending.length) {
    const item = pending.pop()!;
    const target = item.parent as Record<string, unknown>;
    const key = String(item.key);
    const put = (value: unknown) => Object.defineProperty(target, key, { value, enumerable: true, configurable: true, writable: true });
    const current = item.value;
    if (typeof current === 'string') {
      put(sanitizeLogText(current));
      continue;
    }
    if (current == null) {
      put(null);
      continue;
    }
    if (typeof current === 'number') {
      put(Number.isFinite(current) ? current : null);
      continue;
    }
    if (typeof current === 'boolean') {
      put(current);
      continue;
    }
    if (typeof current !== 'object') {
      put('[Valor não serializável]');
      continue;
    }
    if (visited.has(current)) {
      put('[Circular]');
      continue;
    }
    visited.add(current);

    const output: Record<string, unknown> | unknown[] = Array.isArray(current) ? [] : Object.create(null);
    put(output);
    if (current instanceof Error) {
      const parserError = readProperty(current, 'type') === 'entity.parse.failed';
      for (const field of ['name', 'message', 'stack', 'cause']) {
        let property = readProperty(current, field);
        // Mensagens do parser podem reproduzir o body inválido; preservar somente os frames.
        if (parserError && field === 'message') property = 'JSON inválido';
        if (parserError && field === 'stack' && typeof property === 'string') {
          property = 'SyntaxError: JSON inválido' + property.slice(property.indexOf('\n') >= 0 ? property.indexOf('\n') : property.length);
        }
        if (property !== undefined) pending.push({ value: property, parent: output, key: field });
      }
      continue;
    }

    for (const [field, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(current))) {
      if (!descriptor.enumerable) continue;
      if (sensitiveKey.test(field)) {
        Object.defineProperty(output, field, { value: REDACTED, enumerable: true, configurable: true, writable: true });
      } else {
        pending.push({ value: 'value' in descriptor ? descriptor.value : '[Acessor]', parent: output, key: field });
      }
    }
  }

  return holder.result;
}

export function sanitizeLogError(error: unknown): Record<string, unknown> {
  const known = error instanceof AppError;
  const original = error instanceof Error ? error : new Error('Exceção lançada sem instância de Error');
  const fields: Record<string, unknown> = {
    name: readProperty(original, 'name'),
    code: known ? readProperty(error, 'code') : ErrorCode.INTERNAL_ERROR,
    status: known ? readProperty(error, 'status') : 500,
    message: readProperty(original, 'message'),
    stack: readProperty(original, 'stack') ?? '[Pilha indisponível]',
  };
  const cause = readProperty(original, 'cause');
  if (cause !== undefined) fields.cause = cause;
  if (known) fields.details = readProperty(error, 'details');
  else if (!(error instanceof Error)) fields.details = error;
  const result = sanitizeLogDiagnostic(fields) as Record<string, unknown>;
  const name = readProperty(original, 'name');
  result.name = typeof name === 'string' ? sanitizeLogText(name) : 'Error';
  return result;
}

export function sanitizeLogContext(context: LogContext): LogContext {
  const output: Record<string, unknown> = {};
  const fields = ['userId', 'companyId', 'planId', 'role', 'count', 'operation', 'persistenceMode', 'mailType', 'port'];
  for (const key of fields) {
    const value = Object.getOwnPropertyDescriptor(context, key)?.value;
    if (typeof value === 'string') output[key] = sanitizeLogText(value);
    else if (typeof value === 'number' && Number.isFinite(value)) output[key] = value;
  }
  return output;
}
