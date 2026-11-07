import { z } from 'zod';
import { companyDataSchema } from '../entities/company.entity.js';

export const companyCreateSchema = companyDataSchema
  .omit({
    id: true,
    data_cadastro: true,
    status: true,
    verificado: true,
    cover_key: true,
    logo_key: true,
    plan_id: true,
    deleted_at: true,
    deactivation_reason: true,
    deactivated_at: true,
    deactivated_by: true,
  })
  .extend({
    nome: z.string().trim().min(1, 'Nome é obrigatório.'),
    cnpj: z.string().trim().min(1, 'CNPJ é obrigatório.'),
    categoria: z.string().trim().min(1, 'Categoria é obrigatória.'),
    cidade: z.string().trim().min(1, 'Cidade é obrigatória.'),
    estado: z.string().trim().min(1, 'Estado é obrigatório.'),
    email: z.string().trim().email().nullable().optional(),
  })
  .strict();

export type CompanyCreateDTO = z.infer<typeof companyCreateSchema>;

export interface CompanyListFilters {
  q?: string;
  status?: 'ativo' | 'inativo' | 'archived';
  planId?: string;
  offset: number;
  pageSize: number;
}
export interface CompanyAdministrationChange {
  actorId: string | number;
  companyId: string;
  action: 'update' | 'suspend' | 'archive' | 'reactivate' | 'restore';
  fields?: CompanyCreateDTO & { planId: string };
  reason?: string;
  changedAt: string;
}
