import { z } from 'zod';
import { companyDataSchema } from '../../entities/company.entity.js';

const identifier = z.union([z.string().min(1), z.number()]);
const role = z.enum(['empresa', 'cliente']);

export const localUserSchema = z.object({
  id: identifier,
  email: z.string().email(),
  role,
  name: z.string().optional(),
  password_hash: z.string().optional(),
  status: z.string().optional(),
  invite_token: z.string().nullable().optional(),
  reset_password_token: z.string().nullable().optional(),
  reset_password_expires: z.string().nullable().optional(),
  plan_id: identifier.nullable().optional(),
});

export const localDataSchema = z.object({
  version: z.literal(1),
  companies: z.array(companyDataSchema),
  users: z.array(localUserSchema),
  plans: z.array(z.object({
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
  })),
  outbox: z.array(z.object({
    id: z.string(),
    kind: z.enum(['invite', 'password-reset']),
    email: z.string().email(),
    url: z.string(),
    createdAt: z.string(),
  })),
}).strict();

export type LocalData = z.infer<typeof localDataSchema>;
export type LocalUser = z.infer<typeof localUserSchema>;

export function emptyLocalData(): LocalData {
  return { version: 1, companies: [], users: [], plans: [], outbox: [] };
}