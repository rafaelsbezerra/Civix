import type { UserRepository } from '../repositories/user.repository.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import { userJsonRepository } from './json/user.repository.js';
import { userPostgresRepository } from './postgres/user.repository.js';

export const userRepository: UserRepository = USE_MOCK_DATA ? userJsonRepository : userPostgresRepository;