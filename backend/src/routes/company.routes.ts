import { Router } from 'express';
import * as companyController from '../controller/company.controller.js';
import authMiddleware from '../middlewares/auth.js';

const router = Router();

router.post('/', authMiddleware, companyController.createCompany);
router.get('/', companyController.listCompanies);
router.get('/verificadas/todas', companyController.listVerifiedCompanies);
router.get('/buscar', companyController.searchCompanies);
router.get('/categoria/:categoria', companyController.listCompaniesByCategory);
router.get('/estado/:estado', companyController.listCompaniesByState);
router.get('/tamanho/:tamanho', companyController.listCompaniesBySize);
router.get('/:id', companyController.getCompany);

export default router;
