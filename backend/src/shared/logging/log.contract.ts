export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogModule = 'http' | 'server' | 'companies' | 'plans' | 'users' | 'auth' | 'mail' | 'admin' | 'mock' | 'storage';

export interface LogContext {
  userId?: string | number;
  companyId?: string;
  planId?: string | number;
  role?: import('../../entities/user.entity.js').UserRole;
  count?: number;
  operation?: string;
  persistenceMode?: 'json' | 'postgres';
  mailType?: 'invite' | 'password-reset';
  port?: number;
}

export interface LogHttp {
  method: string;
  route: string;
  statusCode: number;
}

export interface LogInput {
  event: string;
  module: LogModule;
  message: string;
  requestId?: string;
  context?: LogContext;
  http?: LogHttp;
  error?: unknown;
}

export interface AppLogger {
  debug(input: LogInput): void;
  info(input: LogInput): void;
  warn(input: LogInput): void;
  error(input: LogInput): void;
  fatal(input: LogInput): void;
  close(): Promise<void>;
}
