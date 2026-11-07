import type { AuthRepository } from '../repositories/auth.repository.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import { authJsonRepository } from './json/auth.repository.js';
import { authPostgresRepository } from './postgres/auth.repository.js';

export const authRepository: AuthRepository = USE_MOCK_DATA
  ? authJsonRepository
  : authPostgresRepository;
