import { USE_MOCK_DATA } from '../shared/config/data.js';
import { storageJsonRepository } from './json/storage.repository.js';
import { storagePostgresRepository } from './postgres/storage.repository.js';
import type { StorageRepository } from '../repositories/storage.repository.js';
export const storageRepository: StorageRepository = USE_MOCK_DATA
  ? storageJsonRepository
  : storagePostgresRepository;
