import type { Company } from '../entities/company.js';

/** Legacy responses: not the new shared HTTP contract. */
export interface CompanyListResult {
  success: boolean;
  data?: Company[];
  message?: string;
  error?: string;
}

export interface CompanyDetailResult {
  success: boolean;
  data?: Company;
  message?: string;
  error?: string;
}
