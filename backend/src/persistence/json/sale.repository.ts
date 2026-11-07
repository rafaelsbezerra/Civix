import type { SaleRepository } from '../../repositories/sale.repository.js';
import { readLocalData, updateLocalData } from './local.store.js';
import { buildManualSale } from '../../services/sale.service.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
export const saleJsonRepository: SaleRepository = {
  async listPlatformSales(filters) {
    const data = await readLocalData();
    const rows = data.sales
      .filter(
        (sale) =>
          (!filters.companyId || sale.companyId === filters.companyId) &&
          (!filters.planId || sale.planId === filters.planId) &&
          (!filters.origin || sale.origin === filters.origin) &&
          (!filters.from || Date.parse(sale.soldAt) >= Date.parse(filters.from)) &&
          (!filters.to || Date.parse(sale.soldAt) <= Date.parse(filters.to)),
      )
      .sort(
        (a, b) =>
          Date.parse(b.soldAt) - Date.parse(a.soldAt) || a.id.localeCompare(b.id),
      );
    return {
      items: rows
        .slice(filters.offset, filters.offset + filters.pageSize)
        .map((sale) => ({
          ...sale,
          companyName: data.companies.find((company) => company.id === sale.companyId)
            ?.nome,
        })),
      total: rows.length,
    };
  },
  async createManualSale(operation) {
    return updateLocalData((data) => {
      const actor = data.users.find(
        (item) => String(item.id) === String(operation.actorId),
      );
      if (
        !actor ||
        actor.role !== 'super_admin' ||
        actor.deleted_at ||
        (actor.status != null && actor.status !== 'active')
      ) {
        throw new AppError({
          status: 403,
          code: ErrorCode.FORBIDDEN,
          message: 'Acesso administrativo alterado.',
        });
      }
      const existing = data.sales.find(
        (sale) =>
          sale.createdBy === String(operation.actorId) &&
          sale.operationId === operation.input.operationId,
      );
      if (existing) {
        if (existing.fingerprint !== operation.fingerprint) {
          throw new AppError({
            status: 409,
            code: ErrorCode.CONFLICT,
            message: 'A operação já foi usada com outros dados.',
          });
        }
        return { sale: existing, replayed: true };
      }
      const company = data.companies.find(
        (item) => item.id === operation.input.companyId,
      );
      if (!company || company.deleted_at || company.status === 'inativo') {
        throw new AppError({
          status: 409,
          code: ErrorCode.CONFLICT,
          message: 'Empresa indisponível para nova venda.',
        });
      }
      const plan = data.plans.find(
        (item) => String(item.id) === String(company.plan_id),
      );
      const sale = buildManualSale(operation, plan);
      data.sales.push(sale);
      return { sale, replayed: false };
    });
  },
  async deleteSaleById(id, actorId) {
    return updateLocalData((data) => {
      const actor = data.users.find((item) => String(item.id) === String(actorId));
      if (
        !actor ||
        actor.role !== 'super_admin' ||
        actor.deleted_at ||
        (actor.status != null && actor.status !== 'active')
      ) {
        throw new AppError({
          status: 403,
          code: ErrorCode.FORBIDDEN,
          message: 'Acesso administrativo alterado.',
        });
      }
      const index = data.sales.findIndex((item) => item.id === id);
      if (index < 0) {
        return false;
      }
      data.sales.splice(index, 1);
      for (const receipt of data.companyRegistrationOperations) {
        if (receipt.saleId === id) {
          receipt.saleId = null;
        }
      }
      return true;
    });
  },
  async getById(id) {
    return (await readLocalData()).sales.find((sale) => sale.id === id);
  },
};
