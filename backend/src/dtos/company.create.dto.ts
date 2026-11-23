import { z } from 'zod';
import {
  BRAZIL_UFS,
  COMPANY_PRICE_RANGES,
  companyDataSchema,
  type BrazilUf,
  type CompanyPriceRange,
} from '../entities/company.entity.js';

export const companyCreateSchema = companyDataSchema
  .omit({
    id: true,
    data_cadastro: true,
    createdAt: true,
    updatedAt: true,
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
    faixa_preco: z.enum(COMPANY_PRICE_RANGES).nullable().optional(),
  })
  .strict();

export type CompanyCreateDTO = z.infer<typeof companyCreateSchema>;

export interface PublicCompanySearchFilters {
  q?: string;
  uf?: BrazilUf;
  priceRange?: CompanyPriceRange;
}

export const publicCompanySearchQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    uf: z.string().trim().toUpperCase().pipe(z.enum(BRAZIL_UFS)).optional(),
    priceRange: z.string().trim().pipe(z.enum(COMPANY_PRICE_RANGES)).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasName = Boolean(data.q && data.q.length > 0);
    const hasUf = Boolean(data.uf);
    const hasPriceRange = Boolean(data.priceRange);

    if (hasUf !== hasPriceRange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasUf ? 'priceRange' : 'uf'],
        message:
          'A busca por região e preço exige que UF e faixa de preço sejam informados juntos.',
      });
    }

    if (!hasName && !(hasUf && hasPriceRange)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['q'],
        message: 'Termo de busca é obrigatório',
      });
    }
  });

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
