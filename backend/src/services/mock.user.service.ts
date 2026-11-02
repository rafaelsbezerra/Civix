import { logger } from '../shared/logging/log.context.js';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { USER_ROLES } from '../entities/user.entity.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import { updateLocalData } from '../persistence/json/local.store.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';

const inputSchema = z.object({
  email: z.string().trim().email(), role: z.enum(USER_ROLES), name: z.string().trim().optional(),
  password: z.string().min(8).optional(), companyId: z.string().uuid().nullable().optional(),
}).superRefine((input, ctx) => {
  if (input.role !== 'cliente' && !input.password) ctx.addIssue({ code: 'custom', message: 'Senha obrigatória para perfis autenticáveis.' });
  const scoped = input.role === 'admin_empresa' || input.role === 'atendente';
  if (scoped ? !input.companyId : input.companyId != null) ctx.addIssue({ code: 'custom', message: 'Empresa incompatível com o perfil.' });
});

export async function createMockUser(input: unknown) {
  if (!USE_MOCK_DATA) throw new Error('O comando de usuário local exige USE_MOCK_DATA=true.');
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'Dados do usuário local inválidos.' });
  const { email, role, name, password, companyId } = parsed.data;
  const user = { id: randomUUID(), email: email.toLowerCase(), role, name, company_id: companyId ?? null,
    status: 'active', invite_token: null, password_hash: password ? await bcrypt.hash(password, 10) : undefined };
  await updateLocalData(data => {
    if (data.users.some(existing => existing.email.toLowerCase() === user.email)) {
      throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'Já existe um usuário com esse e-mail.' });
    }
    if (companyId && !data.companies.some(company => company.id === companyId)) {
      throw new AppError({ status: 400, code: ErrorCode.VALIDATION_ERROR, message: 'Empresa não encontrada.' });
    }
    data.users.push(user);
  });
  logger().info({ event: 'mock.user.created', module: 'mock', message: 'Usuário local criado', context: { userId: user.id, role, persistenceMode: 'json' } });
  return { id: user.id, email: user.email, role };
}
