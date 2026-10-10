import { AppError } from '../errors/app-error.js';

export interface ProductionErrorResponse { status: number; message: string }
export interface DiagnosticErrorResponse extends ProductionErrorResponse {
  code: string;
  details: unknown;
  stack: string;
  requestId?: string;
}
export interface ErrorContext { environment?: string; requestId?: string }

const SENSITIVE_KEY = /password|passwd|secret|token|authorization|cookie|credential|api[-_]?key/i;
const REDACTED = '[REDACTED]';

export function redactText(text: string): string {
  return text
    .replace(/\b(?:postgres(?:ql)?|https?):\/\/[^\s/@:]+:[^\s/@]+@/gi, match => match.slice(0, match.indexOf('://') + 3) + REDACTED + '@')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer ' + REDACTED)
    .replace(/\b(password|passwd|secret|token|authorization|cookie|api[-_]?key)["']?\s*[:=]\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;}]+)/gi, '$1=' + REDACTED);
}

function readErrorProperty(error: Error, key: string): unknown {
  let owner: object | null = error;
  while (owner) {
    const descriptor = Object.getOwnPropertyDescriptor(owner, key);
    if (descriptor) {
      if ('value' in descriptor) return descriptor.value;
      // V8 exposes its lazily computed stack through a native getter.
      if (key === 'stack' && descriptor.get && Function.prototype.toString.call(descriptor.get).includes('[native code]')) {
        try { return descriptor.get.call(error); } catch { return '[Unavailable stack]'; }
      }
      return '[Accessor]';
    }
    owner = Object.getPrototypeOf(owner);
  }
  return undefined;
}

export function sanitizeDiagnostic(value: unknown, visited = new WeakSet<object>(), depth = 0): unknown {
  if (typeof value === 'string') return redactText(value);
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value === undefined) return null;
  if (typeof value !== 'object') return redactText(String(value));
  if (visited.has(value)) return '[Circular]';
  if (depth >= 8) return '[Depth limit]';
  visited.add(value);
  if (value instanceof Error) {
    return {
      name: sanitizeDiagnostic(readErrorProperty(value, 'name'), visited, depth + 1),
      message: sanitizeDiagnostic(readErrorProperty(value, 'message'), visited, depth + 1),
      stack: sanitizeDiagnostic(readErrorProperty(value, 'stack'), visited, depth + 1),
      cause: sanitizeDiagnostic(readErrorProperty(value, 'cause'), visited, depth + 1),
    };
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Array.isArray(value)) {
    return Array.from({ length: value.length }, (_, index) => {
      const descriptor = descriptors[String(index)];
      return !descriptor ? null : 'value' in descriptor ? sanitizeDiagnostic(descriptor.value, visited, depth + 1) : '[Accessor]';
    });
  }
  const result: Record<string, unknown> = {};
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!descriptor.enumerable) continue;
    const item = SENSITIVE_KEY.test(key) ? REDACTED :
      'value' in descriptor ? sanitizeDiagnostic(descriptor.value, visited, depth + 1) : '[Accessor]';
    Object.defineProperty(result, key, { value: item, enumerable: true });
  }
  return result;
}

export function serializeError(error: unknown, context: ErrorContext = {}): ProductionErrorResponse | DiagnosticErrorResponse {
  const known = error instanceof AppError;
  const status = known ? error.status : 500;
  const message = known ? redactText(error.message) : 'Erro interno do servidor';
  if ((context.environment ?? process.env.NODE_ENV) === 'production') return { status, message };
  const stack = readErrorProperty(error instanceof Error ? error : new Error('Non-Error thrown'), 'stack');
  return {
    status, message,
    code: known ? redactText(error.code) : 'INTERNAL_ERROR',
    details: sanitizeDiagnostic(known ? { details: readErrorProperty(error, 'details'), cause: readErrorProperty(error, 'cause') } : error),
    stack: typeof stack === 'string' ? redactText(stack) : '[Unavailable stack]',
    ...(context.requestId ? { requestId: redactText(context.requestId) } : {}),
  };
}
