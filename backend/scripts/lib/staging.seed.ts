import { z } from 'zod';
import {
  localDataSchema,
  type LocalData,
} from '../../src/persistence/json/local.data.js';
import {
  PRICE_RANGE_TO_NUMRANGE,
  type CompanyPriceRange,
} from '../../src/entities/company.entity.js';

function toDatabaseNumrange(faixaPreco?: CompanyPriceRange | null): string | null {
  if (!faixaPreco) {
    return null;
  }
  return PRICE_RANGE_TO_NUMRANGE[faixaPreco] ?? null;
}

export interface SeedConnection {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export class SeedError extends Error {}

function normalizeCompanyStatus(status: string): 'ATIVO' | 'INATIVO' | 'VERIFICADO' {
  const upper = status.trim().toUpperCase();
  if (upper === 'INATIVO') {
    return 'INATIVO';
  }
  if (upper === 'VERIFICADO') {
    return 'VERIFICADO';
  }
  return 'ATIVO';
}

function normalizeUserStatus(status?: string | null): 'ACTIVE' | 'PENDING' | 'BLOCKED' {
  const upper = (status ?? 'ACTIVE').trim().toUpperCase();
  if (upper === 'PENDING') {
    return 'PENDING';
  }
  if (upper === 'BLOCKED') {
    return 'BLOCKED';
  }
  return 'ACTIVE';
}

function requireSeed(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new SeedError(message);
  }
}

function unique(values: string[], label: string): void {
  requireSeed(
    new Set(values).size === values.length,
    'Duplicidade na origem: ' + label + '.',
  );
}

export function decimalPrice(value: string | number): string {
  const text = String(value);
  requireSeed(
    /^\d{1,10}(\.\d{1,2})?$/.test(text),
    'Preço incompatível com NUMERIC(12,2).',
  );
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole).toString() + '.' + fraction.padEnd(2, '0');
}

const uuid = z.string().uuid();
const PLAN_FIELDS = [
  'name',
  'slug',
  'description',
  'price',
  'billing_period',
  'features',
  'limits',
  'is_featured',
  'is_active',
  'display_order',
] as const;

function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return '[' + value.map(canonical).join(',') + ']';
  }
  if (value && typeof value === 'object') {
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => JSON.stringify(key) + ':' + canonical(item))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value) ?? 'null';
}

export function prepareStagingSeed(source: unknown): LocalData {
  const parsed = localDataSchema.safeParse(source);
  requireSeed(
    parsed.success,
    'JSON local inválido. Corrija o arquivo antes de importar.',
  );
  const data = parsed.data;
  unique(
    data.plans.map((plan) => String(plan.id)),
    'IDs de planos',
  );
  unique(
    data.plans.map((plan) => plan.slug),
    'slugs de planos',
  );
  unique(
    data.companies.map((company) => company.id),
    'IDs de empresas',
  );
  unique(
    data.companies.map((company) => company.cnpj),
    'CNPJs',
  );
  unique(
    data.companies
      .filter((company) => company.email != null)
      .map((company) => company.email!.toLowerCase()),
    'e-mails de empresas',
  );
  unique(
    data.users.map((user) => String(user.id)),
    'IDs de usuários',
  );
  requireSeed(
    data.images.length === 0,
    'Importação de imagens/R2 não faz parte deste seed.',
  );
  for (const plan of data.plans) {
    decimalPrice(plan.price);
    requireSeed(
      plan.name.length <= 120 && plan.slug.length <= 120,
      'Nome ou slug de plano excede o limite SQL de 120 caracteres.',
    );
    requireSeed(
      plan.display_order >= -2147483648 && plan.display_order <= 2147483647,
      'Ordem de plano incompatível com INTEGER.',
    );
  }
  for (const company of data.companies) {
    requireSeed(
      uuid.safeParse(company.id).success,
      'Empresa com ID incompatível com UUID.',
    );
    requireSeed(
      !company.cover_key && !company.logo_key,
      'Chaves de capa/logo exigem migração de storage, fora deste seed.',
    );
    requireSeed(
      company.data_cadastro == null ||
        Number.isFinite(Date.parse(company.data_cadastro)),
      'Data de cadastro de empresa inválida.',
    );
  }
  const planIds = new Set(data.plans.map((plan) => String(plan.id)));
  for (const user of data.users) {
    requireSeed(
      uuid.safeParse(user.id).success,
      'Usuário com ID incompatível com UUID.',
    );
    requireSeed(
      user.plan_id == null || planIds.has(String(user.plan_id)),
      'Usuário referencia plano ausente na origem.',
    );
    requireSeed(
      user.status !== 'pending',
      'Convites pendentes não podem ser importados sem tokens.',
    );
    requireSeed(
      user.role === 'cliente' ||
        /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password_hash ?? ''),
      'Usuário autenticável sem hash bcrypt válido. Nenhuma senha será gerada.',
    );
  }
  return data;
}

export function seedSummary(data: LocalData) {
  return {
    plans: data.plans.length,
    companies: data.companies.length,
    users: data.users.length,
  };
}

function samePlan(
  existing: Record<string, unknown>,
  plan: LocalData['plans'][number],
): boolean {
  return PLAN_FIELDS.every((field) =>
    field === 'price'
      ? decimalPrice(String(existing.price)) === decimalPrice(plan.price)
      : canonical(existing[field]) === canonical(plan[field]),
  );
}

export async function applyStagingSeed(
  connection: SeedConnection,
  data: LocalData,
): Promise<void> {
  // Revalidar mesmo em chamadas diretas, antes de qualquer acesso ao banco.
  data = prepareStagingSeed(data);
  await connection.query('BEGIN');
  try {
    await connection.query('SET LOCAL search_path TO public');
    const columns = await connection.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'company_id'",
    );
    requireSeed(
      columns.rows.length === 1,
      'Coluna users.company_id ausente. Prepare as migrations separadamente antes do seed.',
    );
    await connection.query(
      'LOCK TABLE plans, companies, users IN SHARE ROW EXCLUSIVE MODE',
    );
    const occupied = await connection.query(
      'SELECT EXISTS (SELECT 1 FROM companies) AS companies, EXISTS (SELECT 1 FROM users) AS users',
    );
    requireSeed(
      occupied.rows[0] && !occupied.rows[0].companies && !occupied.rows[0].users,
      'Destino já possui empresas ou usuários; seed interrompido sem sobrescrever.',
    );
    const planIds = new Map<string, string>();
    for (const plan of data.plans) {
      const found = await connection.query('SELECT * FROM plans WHERE slug = $1', [
        plan.slug,
      ]);
      let row = found.rows[0];
      if (row) {
        requireSeed(
          samePlan(row, plan),
          'Plano já existente diverge da origem; seed interrompido sem sobrescrever.',
        );
      } else {
        const inserted = await connection.query(
          `INSERT INTO plans (name, slug, description, price, billing_period, features, limits, is_featured, is_active, display_order)
           VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10) RETURNING id`,
          [
            plan.name,
            plan.slug,
            plan.description,
            decimalPrice(plan.price),
            plan.billing_period,
            JSON.stringify(plan.features),
            JSON.stringify(plan.limits),
            plan.is_featured,
            plan.is_active,
            plan.display_order,
          ],
        );
        row = inserted.rows[0];
      }
      requireSeed(row?.id != null, 'O banco não retornou o identificador do plano.');
      planIds.set(String(plan.id), String(row.id));
    }
    for (const company of data.companies) {
      const createdAt =
        company.createdAt ?? company.data_cadastro ?? new Date().toISOString();
      const updatedAt = company.updatedAt ?? createdAt;
      const priceRange = toDatabaseNumrange(company.faixa_preco);

      await connection.query(
        `INSERT INTO companies (id, name, cnpj, description, detailed_description, category, city, state,
          status, is_verified, size, price_range, created_at, updated_at, logo, address, phone, email, website, whatsapp, additional_description, tone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::company_status,$10,$11,$12::numrange,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        [
          company.id,
          company.nome,
          company.cnpj,
          company.descricao,
          company.descricao_detalhada,
          company.categoria,
          company.cidade,
          company.estado,
          normalizeCompanyStatus(company.status),
          company.verificado,
          company.tamanho,
          priceRange,
          createdAt,
          updatedAt,
          company.logo ?? null,
          company.endereco ?? null,
          company.telefone ?? null,
          company.email ?? null,
          company.website ?? null,
          company.whatsapp ?? null,
          company.descritivo ?? null,
          company.tone ?? null,
        ],
      );
    }
    for (const user of data.users) {
      await connection.query(
        `INSERT INTO users (id, name, email, role, password_hash, status, company_id, plan_id,
          invite_token, reset_password_token, reset_password_expires, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6::user_status,$7,$8,NULL,NULL,NULL,NOW(),NOW())`,
        [
          user.id,
          user.name ?? null,
          user.email,
          user.role,
          user.password_hash ?? null,
          normalizeUserStatus(user.status),
          user.company_id,
          user.plan_id == null ? null : planIds.get(String(user.plan_id)),
        ],
      );
    }
    await connection.query('COMMIT');
  } catch (error) {
    // Não substituir o erro original caso a conexão também falhe no rollback.
    await connection.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}
