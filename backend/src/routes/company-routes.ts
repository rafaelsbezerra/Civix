import type { CompanyQuery } from '../interfaces/company-query.js';
import { Router } from 'express';
import { db } from '../config/data.js';
import { createCompanyController } from '../controllers/company-controller.js';
import { createCompanyService } from '../services/company-service.js';

export function createCompanyRouter(queryClient: CompanyQuery) {
  const router = Router();
  const controller = createCompanyController(createCompanyService(queryClient));

  router.get('/', controller.listCompanies);
  router.get('/verificadas/todas', controller.listVerifiedCompanies);
  router.get('/buscar', controller.searchCompanies);
  router.get('/categoria/:categoria', controller.listCompaniesByCategory);
  router.get('/estado/:estado', controller.listCompaniesByState);
  router.get('/tamanho/:tamanho', controller.listCompaniesBySize);
  router.get('/:id', controller.getCompany);

  return router;
}

export default createCompanyRouter(db);
