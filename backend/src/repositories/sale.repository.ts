import type { Sale } from '../entities/sale.entity.js';
export interface SaleRepository { getById(id: string): Promise<Sale | undefined> }
