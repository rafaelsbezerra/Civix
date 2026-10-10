import type { Request, Response } from 'express';
import * as companyService from '../services/company.service.js';

export async function listCompanies(req: Request, res: Response): Promise<Response> {
  try {
    const response = await companyService.getCompanies();

    if (response.success) {
      return res.status(200).json(response);
    } else {
      return res.status(500).json(response);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas',
    });
  }
}

export async function listVerifiedCompanies(req: Request, res: Response): Promise<Response> {
  try {
    const response = await companyService.getVerifiedCompanies();

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas verificadas',
    });
  }
}

export async function searchCompanies(req: Request, res: Response): Promise<Response> {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Termo de busca é obrigatório',
      });
    }

    const response = await companyService.searchCompanies(q);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas',
    });
  }
}

export async function listCompaniesByCategory(req: Request, res: Response): Promise<Response> {
  try {
    const { categoria: category } = req.params as { categoria: string };

    if (!category || category.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Categoria é obrigatória',
      });
    }

    const response = await companyService.getCompaniesByCategory(category);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas por categoria',
    });
  }
}

export async function listCompaniesByState(req: Request, res: Response): Promise<Response> {
  try {
    const { estado: state } = req.params as { estado: string };

    if (!state || state.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Estado é obrigatório',
      });
    }

    const response = await companyService.getCompaniesByState(state);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas por estado',
    });
  }
}

export async function listCompaniesBySize(req: Request, res: Response): Promise<Response> {
  try {
    const { tamanho: size } = req.params as {
      tamanho: 'pequena' | 'media' | 'grande';
    };

    if (!['pequena', 'media', 'grande'].includes(size)) {
      return res.status(400).json({
        success: false,
        error: 'Tamanho inválido. Use: pequena, media ou grande',
      });
    }

    const response = await companyService.getCompaniesBySize(size);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas por tamanho',
    });
  }
}

export async function getCompany(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params as { id: string };

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ID da empresa é obrigatório',
      });
    }

    const response = await companyService.getCompanyById(id);

    if (response.success) {
      return res.status(200).json(response);
    } else {
      return res.status(404).json(response);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresa',
    });
  }
}
