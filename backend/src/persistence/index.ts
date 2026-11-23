import { USE_MOCK_DATA } from '../shared/config/data.js';
import { authJsonRepository } from './json/auth.repository.js';
import { companyJsonRepository } from './json/company.repository.js';
import { planJsonRepository } from './json/plan.repository.js';
import { saleJsonRepository } from './json/sale.repository.js';
import { storageJsonRepository } from './json/storage.repository.js';
import { userJsonRepository } from './json/user.repository.js';
import { authPostgresRepository } from './postgres/auth.repository.js';
import { companyPostgresRepository } from './postgres/company.repository.js';
import { planPostgresRepository } from './postgres/plan.repository.js';
import { salePostgresRepository } from './postgres/sale.repository.js';
import { storagePostgresRepository } from './postgres/storage.repository.js';
import { userPostgresRepository } from './postgres/user.repository.js';

export const authRepository = USE_MOCK_DATA
  ? authJsonRepository
  : authPostgresRepository;
export const companyRepository = USE_MOCK_DATA
  ? companyJsonRepository
  : companyPostgresRepository;
export const planRepository = USE_MOCK_DATA
  ? planJsonRepository
  : planPostgresRepository;
export const saleRepository = USE_MOCK_DATA
  ? saleJsonRepository
  : salePostgresRepository;
export const storageRepository = USE_MOCK_DATA
  ? storageJsonRepository
  : storagePostgresRepository;
export const userRepository = USE_MOCK_DATA
  ? userJsonRepository
  : userPostgresRepository;
