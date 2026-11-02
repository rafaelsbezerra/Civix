import type { Company } from '../entities/company.entity.js';
import type { UserId } from '../entities/user.entity.js';
import type { Sale } from '../entities/sale.entity.js';

export interface CompanyRegistration {
  company: Company;
  planId: string;
  actorId: UserId;
  operationId: string;
  fingerprint: string;
}
export interface CompanyRegistrationResult { company: Company; sale: Sale; replayed: boolean }
