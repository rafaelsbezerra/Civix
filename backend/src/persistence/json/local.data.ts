import { z } from 'zod';
import { companyDataSchema } from '../../entities/company.entity.js';
import { USER_ROLES } from '../../entities/user.entity.js';
import { saleSchema } from '../../entities/sale.entity.js';

const identifier = z.union([z.string().min(1), z.number()]);
export const localUserSchema = z.object({
  id: identifier,
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  name: z.string().optional(),
  password_hash: z.string().optional(),
  status: z.string().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  deactivation_reason: z.string().nullable().optional(),
  tokens_revoked_at: z.string().datetime().nullable().optional(),
  company_id: z.string().uuid().nullable().default(null),
  invite_token: z.string().nullable().optional(),
  reset_password_token: z.string().nullable().optional(),
  reset_password_expires: z.string().nullable().optional(),
  plan_id: identifier.nullable().optional(),
});

const imageSchema = z.object({
  id: z.string().uuid(),
  object_key: z.string().min(1),
  original_name: z.string().min(1),
  mime_type: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  size_bytes: z.number().int().positive().max(10000000),
  module: z.string().min(1),
  resource_id: z.string().uuid(),
  purpose: z.string().min(1),
  uploaded_by: z.string().uuid(),
  created_at: z.string().datetime(),
});
export const localDataSchema = z
  .object({
    version: z.literal(1),
    companies: z.array(companyDataSchema),
    users: z.array(localUserSchema),
    images: z.array(imageSchema).default([]),
    sales: z.array(saleSchema).default([]),
    companyRegistrationOperations: z
      .array(
        z.object({
          actorId: z.string(),
          operationId: z.string().uuid(),
          fingerprint: z.string().length(64),
          companyId: z.string().uuid(),
          saleId: z.string().uuid().nullable(),
          createdAt: z.string().datetime(),
        }),
      )
      .default([]),
    plans: z.array(
      z.object({
        id: identifier,
        name: z.string(),
        slug: z.string(),
        description: z.string(),
        price: z.union([z.string(), z.number()]),
        billing_period: z.enum(['monthly', 'yearly', 'one_time']),
        features: z.array(z.string()),
        limits: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
        is_featured: z.boolean(),
        is_active: z.boolean(),
        display_order: z.number().int(),
      }),
    ),
    outbox: z.array(
      z.object({
        id: z.string(),
        kind: z.enum(['invite', 'password-reset']),
        email: z.string().email(),
        url: z.string(),
        createdAt: z.string(),
      }),
    ),
  })
  .strict()
  .superRefine((data, ctx) => {
    const emails = new Set<string>();
    for (const [index, user] of data.users.entries()) {
      const email = user.email.toLowerCase();
      if (emails.has(email)) {
        ctx.addIssue({
          code: 'custom',
          path: ['users', index, 'email'],
          message: 'E-mail duplicado.',
        });
      }
      emails.add(email);
      const needsCompany = user.role === 'admin_empresa' || user.role === 'atendente';
      if (
        needsCompany
          ? !user.company_id ||
            !data.companies.some((company) => company.id === user.company_id)
          : user.company_id !== null
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['users', index, 'company_id'],
          message: 'Vínculo empresarial inválido.',
        });
      }
    }
  });
export type LocalData = z.infer<typeof localDataSchema>;
export type LocalUser = z.infer<typeof localUserSchema>;
export function emptyLocalData(): LocalData {
  return {
    version: 1,
    companies: [],
    users: [],
    images: [],
    plans: [],
    sales: [],
    companyRegistrationOperations: [],
    outbox: [],
  };
}
