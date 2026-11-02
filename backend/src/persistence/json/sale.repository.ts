import type { SaleRepository } from '../../repositories/sale.repository.js';
import { readLocalData } from './local.store.js';
export const saleJsonRepository: SaleRepository = {
  async getById(id) { return (await readLocalData()).sales.find(sale => sale.id === id); },
};
