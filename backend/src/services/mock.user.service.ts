import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import { updateLocalData } from '../persistence/json/local.store.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';

const inputSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(['empresa', 'cliente']),
  name: z.string().trim().optional(),
  password: z.string().min(8).optional(),
}).superRefine((input, context) => {
  if (input.role === 'empresa' && !input.password) {
    context.addIssue({ code: 'custom', path: ['password'], message: 'Senha é obrigatória para empresas.' });
  }
});

export async function createMockUser(input: unknown) {
  if (!USE_MOCK_DATA) {
    throw new Error('O comando de usuário local exige USE_MOCK_DATA=true.');
  }

  const parsed = inputSchema.safeParse(input, { error: () => 'Valor inválido para este campo.' });

  if (!parsed.success) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Dados do usuário local inválidos.',
      details: parsed.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
    });
  }

  const { email, role, name, password } = parsed.data;
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
  const user = {
    id: randomUUID(),
    email,
    role,
    ...(name ? { name } : {}),
    ...(passwordHash ? { password_hash: passwordHash } : {}),
  };

  await updateLocalData(data => {
    if (data.users.some(existing => existing.email === email && existing.role === role)) {
      throw new AppError({
        status: 409,
        code: ErrorCode.CONFLICT,
        message: 'Já existe um usuário local com esse e-mail e perfil.',
      });
    }

    data.users.push(user);
  });

  return { id: user.id, email, role };
}