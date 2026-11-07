import type { PlanRepository } from '../repositories/plan.repository.js';
import { USE_MOCK_DATA } from '../shared/config/data.js';
import { planJsonRepository } from './json/plan.repository.js';
import { planPostgresRepository } from './postgres/plan.repository.js';

export const planRepository: PlanRepository = USE_MOCK_DATA
  ? planJsonRepository
  : planPostgresRepository;
