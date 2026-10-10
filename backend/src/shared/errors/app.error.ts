import { ErrorCode } from './error.code.js';

export interface AppErrorOptions {
  status: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });

    if (!Number.isInteger(options.status) || options.status < 400 || options.status > 599) {
      throw new RangeError('O status de AppError deve estar entre 400 e 599');
    }
    if (!Object.values(ErrorCode).includes(options.code) || !options.message.trim()) {
      throw new TypeError('AppError exige um código e uma mensagem pública');
    }

    this.name = 'AppError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}
