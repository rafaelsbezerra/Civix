import type { Request, Response } from 'express';
import * as companyService from '../services/company.service.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { createSuccessResponse } from '../shared/contracts/response.contract.js';

export async function listCompanies(req: Request, res: Response): Promise<Response> {
  const result = await companyService.getCompanies();

  return res.status(200).json(createSuccessResponse(result));
}

export async function listVerifiedCompanies(req: Request, res: Response): Promise<Response> {
  const result = await companyService.getVerifiedCompanies();

  return res.status(200).json(createSuccessResponse(result));
}

export async function searchCompanies(req: Request, res: Response): Promise<Response> {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim() === '') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Termo de busca é obrigatório',
    });
  }

  const result = await companyService.searchCompanies(q);

  return res.status(200).json(createSuccessResponse(result));
}

export async function listCompaniesByCategory(req: Request, res: Response): Promise<Response> {
  const { categoria: category } = req.params as { categoria: string };

  if (!category || category.trim() === '') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Categoria é obrigatória',
    });
  }

  const result = await companyService.getCompaniesByCategory(category);

  return res.status(200).json(createSuccessResponse(result));
}

export async function listCompaniesByState(req: Request, res: Response): Promise<Response> {
  const { estado: state } = req.params as { estado: string };

  if (!state || state.trim() === '') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Estado é obrigatório',
    });
  }

  const result = await companyService.getCompaniesByState(state);

  return res.status(200).json(createSuccessResponse(result));
}

export async function listCompaniesBySize(req: Request, res: Response): Promise<Response> {
  const { tamanho: size } = req.params as { tamanho: 'pequena' | 'media' | 'grande' };

  if (!['pequena', 'media', 'grande'].includes(size)) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Tamanho inválido. Use: pequena, media ou grande',
    });
  }

  const result = await companyService.getCompaniesBySize(size);

  return res.status(200).json(createSuccessResponse(result));
}

export async function getCompany(req: Request, res: Response): Promise<Response> {
  const { id } = req.params as { id: string };

  if (!id || id.trim() === '') {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'ID da empresa é obrigatório',
    });
  }

  const result = await companyService.getCompanyById(id);

  return res.status(200).json(createSuccessResponse(result));
}
