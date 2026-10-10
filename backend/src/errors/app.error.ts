export interface AppErrorOptions {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    if (!Number.isInteger(options.status) || options.status < 400 || options.status > 599) {
      throw new RangeError('O status de AppError deve estar entre 400 e 599');
    }
    if (!options.code.trim() || !options.message.trim()) {
      throw new TypeError('AppError exige um código e uma mensagem pública');
    }
    this.name = 'AppError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}
