import type { PlanRepository } from '../../repositories/plan.repository.js';
import type { PlanRow } from '../../interfaces/plan.row.js';
import { db } from '../../shared/config/data.js';

export const planPostgresRepository: PlanRepository = {
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