import { ErrorCode } from '../errors/error.code.js';
import { AppError } from '../errors/app.error.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationInput {
  page: number;
  pageSize: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function invalidPagination(): never {
  throw new AppError({
    status: 400,
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Paginação inválida',
  });
}

function parseInteger(value: unknown, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    const parsed = Number(value);

    if (Number.isSafeInteger(parsed)) {
      return parsed;
    }
  }

  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  return invalidPagination();
}

export function parsePagination(query: {
  page?: unknown;
  pageSize?: unknown;
}): PaginationInput {
  const page = parseInteger(query.page, 1);
  const pageSize = parseInteger(query.pageSize, DEFAULT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  if (pageSize > MAX_PAGE_SIZE || !Number.isSafeInteger(offset)) {
    return invalidPagination();
  }

  return { page, pageSize, offset };
}

export function createPaginationMeta(
  input: PaginationInput,
  total: number,
): PaginationMeta {
  if (!Number.isSafeInteger(total) || total < 0) {
    throw new RangeError('O total deve ser um inteiro seguro maior ou igual a zero');
  }

  const checked = parsePagination(input);

  if (checked.offset !== input.offset) {
    throw new RangeError(
      'O deslocamento não corresponde à página e ao tamanho da página',
    );
  }

  return {
    page: checked.page,
    pageSize: checked.pageSize,
    total,
    totalPages: Math.ceil(total / checked.pageSize),
  };
}
