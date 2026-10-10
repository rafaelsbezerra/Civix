import type { Company } from '../entities/company.js';

/** Narrow query dependency used to test existing SQL without a remote database. */
export interface CompanyQuery {
  query(query: string, values?: string[]): Promise<{ rows: Company[] }>;
}
