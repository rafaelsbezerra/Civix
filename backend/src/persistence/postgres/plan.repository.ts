import type { PlanRepository } from '../../repositories/plan.repository.js';
import type { PlanRow } from '../../interfaces/plan.row.js';
import { db } from '../../shared/config/data.js';
import type { PlanInput } from '../../entities/plan.entity.js';
import { AppError } from '../../shared/errors/app.error.js';
import { ErrorCode } from '../../shared/errors/error.code.js';
import type { User, UserId } from '../../entities/user.entity.js';

function values(input: PlanInput) {
  return [input.name, input.slug, input.description, input.price, input.billingPeriod,
    JSON.stringify(input.features), JSON.stringify(input.limits), input.isFeatured, input.isActive, input.displayOrder];
}
async function writePlan(sql: string, input: unknown[], actorId: UserId): Promise<PlanRow | undefined> {
  try { return await db.transaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration',0))");
    const actor = (await client.query<User>('SELECT * FROM users WHERE id=$1 FOR UPDATE',[actorId])).rows[0];
    if (!actor || actor.role !== 'super_admin' || actor.company_id !== null || !actor.password_hash || actor.deleted_at || actor.status != null && actor.status !== 'active') throw new AppError({ status:403,code:ErrorCode.FORBIDDEN,message:'Acesso administrativo alterado.' });
    return (await client.query<PlanRow>(sql,input)).rows[0];
  }); }
  catch (error) {
    if ((error as { code?: string }).code === '23505') throw new AppError({ status: 409, code: ErrorCode.CONFLICT, message: 'Identificador do plano já cadastrado.' });
    throw error;
  }
}

export const planPostgresRepository: PlanRepository = {
  async getAll() { return (await db.query<PlanRow>('SELECT * FROM plans ORDER BY display_order, id')).rows; },
  async getById(id) { return (await db.query<PlanRow>('SELECT * FROM plans WHERE id = $1', [id])).rows[0]; },
  async create(input, actorId) {
    const row = await writePlan(`INSERT INTO plans (name, slug, description, price, billing_period, features, limits, is_featured, is_active, display_order)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10) RETURNING *`, values(input), actorId);
    if (!row) throw new Error('O banco não retornou o plano cadastrado.');
    return row;
  },
  async update(id, input, actorId) {
    return writePlan(`UPDATE plans SET name=$1, slug=$2, description=$3, price=$4, billing_period=$5,
      features=$6::jsonb, limits=$7::jsonb, is_featured=$8, is_active=$9, display_order=$10, updated_at=NOW()
      WHERE id=$11 RETURNING *`, [...values(input), id], actorId);
  },
  async setActive(id, active, actorId) {
    return writePlan('UPDATE plans SET is_active=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [active, id], actorId);
  },
  async getActive() {
    const result = await db.query<PlanRow>(`
    SELECT id, name, slug, description, price, billing_period,
           features, limits, is_featured, is_active, display_order
    FROM plans
    WHERE is_active = TRUE
    ORDER BY display_order ASC, id ASC
  `);

    return result.rows;
  },

  async getActiveById(id) {
    const result = await db.query<PlanRow>(`
    SELECT id, name, slug, description, price, billing_period,
           features, limits, is_featured, is_active, display_order
    FROM plans
    WHERE id = $1 AND is_active = TRUE
  `, [id]);
    const plan = result.rows[0];

    return plan;
  },
};
