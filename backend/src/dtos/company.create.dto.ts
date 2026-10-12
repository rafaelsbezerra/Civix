import { z } from 'zod';
import { companyDataSchema } from '../entities/company.entity.js';

export const companyCreateSchema = companyDataSchema.omit({
  id: true,
  data_cadastro: true,
  status: true,
  verificado: true,
}).extend({
  nome: z.string().trim().min(1, 'Nome é obrigatório.'),
  cnpj: z.string().trim().min(1, 'CNPJ é obrigatório.'),
  categoria: z.string().trim().min(1, 'Categoria é obrigatória.'),
  cidade: z.string().trim().min(1, 'Cidade é obrigatória.'),
  estado: z.string().trim().min(1, 'Estado é obrigatório.'),
}).strict();

export type CompanyCreateDTO = z.infer<typeof companyCreateSchema>;