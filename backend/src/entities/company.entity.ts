import { z } from 'zod';

export const BRAZIL_UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export type BrazilUf = (typeof BRAZIL_UFS)[number];

export const COMPANY_PRICE_RANGES = [
  '0-100',
  '100-300',
  '300-500',
  '500-plus',
] as const;

export type CompanyPriceRange = (typeof COMPANY_PRICE_RANGES)[number];

export const PRICE_RANGE_TO_NUMRANGE: Record<CompanyPriceRange, string> = {
  '0-100': '[0,100]',
  '100-300': '[100,300]',
  '300-500': '[300,500]',
  '500-plus': '[500,)',
};

export interface Company {
  id: string;
  nome: string;
  cnpj: string;
  descricao: string;
  descricao_detalhada: string;
  categoria: string;
  logo?: string | null;
  cover_key?: string | null;
  logo_key?: string | null;
  cidade: string;
  estado: string;
  endereco?: string | null;
  telefone?: string | null;
  email?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  status: 'ativo' | 'inativo' | 'verificado';
  data_cadastro?: string;
  createdAt?: string;
  updatedAt?: string;
  verificado: boolean;
  tamanho: 'pequena' | 'media' | 'grande';
  faixa_preco?: CompanyPriceRange | null;
  descritivo?: string | null;
  tone?: 'blue' | 'green' | 'orange' | 'purple' | 'gray' | null;
  plan_id?: string | null;
  deleted_at?: string | null;
  deactivation_reason?: string | null;
  deactivated_at?: string | null;
  deactivated_by?: string | null;
}

export const companyDataSchema = z.object({
  plan_id: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
  deactivation_reason: z.string().nullable().optional(),
  deactivated_at: z.string().nullable().optional(),
  deactivated_by: z.string().nullable().optional(),
  id: z.string().min(1),
  nome: z.string().min(1),
  cnpj: z.string().min(1),
  descricao: z.string(),
  descricao_detalhada: z.string(),
  categoria: z.string().min(1),
  cidade: z.string().min(1),
  estado: z.string().min(1),
  status: z.enum(['ativo', 'inativo', 'verificado']),
  verificado: z.boolean(),
  tamanho: z.enum(['pequena', 'media', 'grande']),
  faixa_preco: z.enum(COMPANY_PRICE_RANGES).nullable().optional(),
  data_cadastro: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  logo: z.string().nullable().optional(),
  cover_key: z.string().nullable().optional(),
  logo_key: z.string().nullable().optional(),
  endereco: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  descritivo: z.string().nullable().optional(),
  tone: z.enum(['blue', 'green', 'orange', 'purple', 'gray']).nullable().optional(),
});
