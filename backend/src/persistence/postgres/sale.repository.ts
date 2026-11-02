import type { SaleRepository } from '../../repositories/sale.repository.js';
import type { SaleRow } from '../../interfaces/sale.row.js';
import { db } from '../../shared/config/data.js';
import { toSale } from '../sale.mapper.js';
export const salePostgresRepository: SaleRepository = {
  async getById(id) {
    const row = (await db.query<SaleRow>('SELECT * FROM sales WHERE id = $1', [id])).rows[0];
    return row ? toSale(row) : undefined;
  },
};
