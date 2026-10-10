import type { Request, Response } from 'express';
import type { CompanyService } from '../services/company-service.js';

/** Keep the existing validation, messages and HTTP statuses. */
export function createCompanyController(service: CompanyService) {
  return {
    listCompanies: async (req: Request, res: Response) => {
      try {
        const response = await service.getCompanies();

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
    },
    listVerifiedCompanies: async (req: Request, res: Response) => {
      try {
        const response = await service.getVerifiedCompanies();

        return res.status(200).json(response);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor ao buscar empresas verificadas',
        });
      }
    },
    searchCompanies: async (req: Request, res: Response) => {
      try {
        const { q } = req.query;

        if (!q || typeof q !== 'string' || q.trim() === '') {
          return res.status(400).json({
            success: false,
            error: 'Termo de busca é obrigatório',
          });
        }

        const response = await service.searchCompanies(q);

        return res.status(200).json(response);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor ao buscar empresas',
        });
      }
    },
    listCompaniesByCategory: async (req: Request, res: Response) => {
      try {
        const { categoria: category } = req.params as { categoria: string };

        if (!category || category.trim() === '') {
          return res.status(400).json({
            success: false,
            error: 'Categoria é obrigatória',
          });
        }

        const response = await service.getCompaniesByCategory(category);

        return res.status(200).json(response);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor ao buscar empresas por categoria',
        });
      }
    },
    listCompaniesByState: async (req: Request, res: Response) => {
      try {
        const { estado: state } = req.params as { estado: string };

        if (!state || state.trim() === '') {
          return res.status(400).json({
            success: false,
            error: 'Estado é obrigatório',
          });
        }

        const response = await service.getCompaniesByState(state);

        return res.status(200).json(response);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor ao buscar empresas por estado',
        });
      }
    },
    listCompaniesBySize: async (req: Request, res: Response) => {
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

        const response = await service.getCompaniesBySize(size);

        return res.status(200).json(response);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor ao buscar empresas por tamanho',
        });
      }
    },
    getCompany: async (req: Request, res: Response) => {
      try {
        const { id } = req.params as { id: string };

        if (!id || id.trim() === '') {
          return res.status(400).json({
            success: false,
            error: 'ID da empresa é obrigatório',
          });
        }

        const response = await service.getCompanyById(id);

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
    },
  };
}
