import { ErrorCode } from '../errors/error.code.js';
import { AppError } from '../errors/app.error.js';

export interface ProductionErrorResponse {
  status: number;
  message: string;
}

export interface DiagnosticErrorResponse extends ProductionErrorResponse {
  code: ErrorCode;
  details: unknown;
  stack: string;
  requestId?: string;
}

export interface ErrorContext {
  environment?: string;
  requestId?: string;
}

const SENSITIVE_KEY = /password|passwd|secret|token|authorization|cookie|credential|api[-_]?key/i;
const REDACTED = '[REMOVIDO]';

export function redactText(text: string): string {
  return text
    .replace(/\b(?:postgres(?:ql)?|https?):\/\/[^\s/@:]+:[^\s/@]+@/gi, match => {
      return match.slice(0, match.indexOf('://') + 3) + REDACTED + '@';
    })
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer ' + REDACTED)
    .replace(/\b(password|passwd|secret|token|authorization|cookie|api[-_]?key)["']?\s*[:=]\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;}]+)/gi, '$1=' + REDACTED);
}

function readErrorProperty(error: Error, key: string): unknown {
  let owner: object | null = error;

  while (owner) {
    const descriptor = Object.getOwnPropertyDescriptor(owner, key);

    if (descriptor) {
      if ('value' in descriptor) {
        return descriptor.value;
      }

      // O V8 expõe a pilha calculada sob demanda por um getter nativo.
      if (key === 'stack' && descriptor.get && Function.prototype.toString.call(descriptor.get).includes('[native code]')) {
        try {
          return descriptor.get.call(error);
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

export function sanitizeDiagnostic(value: unknown, visited = new WeakSet<object>(), depth = 0): unknown {
  if (typeof value === 'string') {
    return redactText(value);
  }

  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value === undefined) {
    return null;
  }

  if (typeof value !== 'object') {
    return redactText(String(value));
  }

  if (visited.has(value)) {
    return '[Circular]';
  }

  if (depth >= 8) {
    return '[Limite de profundidade]';
  }

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

      if (!descriptor) {
        return null;
      }

      return 'value' in descriptor
        ? sanitizeDiagnostic(descriptor.value, visited, depth + 1)
        : '[Acessor]';
    });
  }

  const result: Record<string, unknown> = {};

  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!descriptor.enumerable) {
      continue;
    }

    const item = SENSITIVE_KEY.test(key)
      ? REDACTED
      : 'value' in descriptor
        ? sanitizeDiagnostic(descriptor.value, visited, depth + 1)
        : '[Acessor]';

    Object.defineProperty(result, key, { value: item, enumerable: true });
  }

  return result;
}

export function serializeError(error: unknown, context: ErrorContext = {}): ProductionErrorResponse | DiagnosticErrorResponse {
  const known = error instanceof AppError;
  const status = known ? error.status : 500;
  const message = known ? redactText(error.message) : 'Erro interno do servidor';

  if ((context.environment ?? process.env.NODE_ENV) === 'production') {
    return { status, message };
  }

  const originalError = error instanceof Error
    ? error
    : new Error('Exceção lançada sem instância de Error');
  const stack = readErrorProperty(originalError, 'stack');
  const diagnostic = known
    ? { details: readErrorProperty(error, 'details'), cause: readErrorProperty(error, 'cause') }
    : error;

  return {
    status,
    message,
    code: known ? error.code : ErrorCode.INTERNAL_ERROR,
    details: sanitizeDiagnostic(diagnostic),
    stack: typeof stack === 'string' ? redactText(stack) : '[Pilha indisponível]',
    ...(context.requestId ? { requestId: redactText(context.requestId) } : {}),
  };
}
