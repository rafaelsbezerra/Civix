import { randomUUID } from 'node:crypto';
import { mkdir, readFile, open, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { MOCK_DATA_DIR, USE_MOCK_DATA } from '../../shared/config/data.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import { emptyLocalData, localDataSchema, type LocalData } from './local.data.js';

export const LOCAL_DATA_FILE = join(MOCK_DATA_DIR, 'data.json');

const lockFile = join(MOCK_DATA_DIR, 'data.lock');

let queue: Promise<void> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  if (!USE_MOCK_DATA) {
    return Promise.reject(new Error('O armazenamento local exige USE_MOCK_DATA=true.'));
  }

  const pending = queue.then(operation);

  // Uma falha não deve bloquear as próximas operações.
  queue = pending.then(() => undefined, () => undefined);

  return pending;
}

async function readStoredData(): Promise<LocalData> {
  let content: string;

  try {
    content = await readFile(LOCAL_DATA_FILE, 'utf8');
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'ENOENT') {
      return emptyLocalData();
    }

    throw cause;
  }

  try {
    return localDataSchema.parse(JSON.parse(content));
  } catch (cause) {
    throw new AppError({
      status: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Erro interno do servidor',
      details: { message: 'O arquivo de dados locais é inválido; ele foi preservado.' },
      cause,
    });
  }
}

async function saveStoredData(data: LocalData): Promise<void> {
  const validated = localDataSchema.parse(data);

  await mkdir(MOCK_DATA_DIR, { recursive: true });

  const temporaryFile = join(MOCK_DATA_DIR, 'data.' + process.pid + '.' + randomUUID() + '.tmp');

  try {
    const file = await open(temporaryFile, 'wx', 0o600);

    try {
      await file.writeFile(JSON.stringify(validated, null, 2) + '\n', 'utf8');
      await file.sync();
    } finally {
      await file.close();
    }

    await rename(temporaryFile, LOCAL_DATA_FILE);
  } finally {
    await unlink(temporaryFile).catch(error => {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    });
  }
}

export function readLocalData(): Promise<LocalData> {
  return enqueue(readStoredData);
}

export function updateLocalData<T>(update: (data: LocalData) => T | Promise<T>): Promise<T> {
  return enqueue(async () => {
    await mkdir(MOCK_DATA_DIR, { recursive: true });

    let lock;

    try {
      lock = await open(lockFile, 'wx', 0o600);
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Os dados locais estão em uso por outro processo. Tente novamente.',
          cause,
        });
      }

      throw cause;
    }

    try {
      await lock.writeFile(String(process.pid), 'utf8');

      const data = await readStoredData();
      const result = await update(data);

      await saveStoredData(data);

      return result;
    } finally {
      await lock.close();

      // Remover somente o bloqueio adquirido por esta operação.
      await unlink(lockFile);
    }
  });
}
