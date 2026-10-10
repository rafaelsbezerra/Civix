import type { Company } from '../entities/company.entity.js';

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
