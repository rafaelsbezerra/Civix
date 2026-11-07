import { USE_MOCK_DATA } from '../shared/config/data.js';
import { saleJsonRepository } from './json/sale.repository.js';
import { salePostgresRepository } from './postgres/sale.repository.js';
export const saleRepository = USE_MOCK_DATA
  ? saleJsonRepository
  : salePostgresRepository;
