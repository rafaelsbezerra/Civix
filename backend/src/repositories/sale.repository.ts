import type { Sale } from '../entities/sale.entity.js';
import type { UserId } from '../entities/user.entity.js';
import type { ManualSaleOperation, SaleListFilters } from '../dtos/sale.dto.js';
export interface SaleRepository {
  getById(id: string): Promise<Sale | undefined>;
  listPlatformSales(filters: SaleListFilters): Promise<{ items: Sale[]; total: number }>;
  createManualSale(input: ManualSaleOperation): Promise<{ sale: Sale; replayed: boolean }>;
  deleteSaleById(id: string, actorId: UserId): Promise<boolean>;
}
