/**
 * Rotas de Empresas
 * Endpoints da API para catálogo de empresas
 */

import { Router, Request, Response } from 'express';
import {
  getEmpresas,
  getEmpresaById,
  getEmpresasByCategoria,
  getEmpresasVerificadas,
  getEmpresasByEstado,
  getEmpresasByTamanho,
  searchEmpresas,
} from '../services/empresaService.js';

const router = Router();

/**
 * GET /api/empresas
 * Retorna todas as empresas do catálogo
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const response = await getEmpresas();

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
});

/**
 * GET /api/empresas/verificadas/todas
 * Retorna apenas empresas verificadas
 */
router.get('/verificadas/todas', async (req: Request, res: Response) => {
  try {
    const response = await getEmpresasVerificadas();

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas verificadas',
    });
  }
});

/**
 * GET /api/empresas/buscar/query?q=termo
 * Busca empresas pelo nome (busca parcial)
 */
router.get('/buscar/query', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Termo de busca é obrigatório',
      });
    }

    const response = await searchEmpresas(q);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas',
    });
  }
});

/**
 * GET /api/empresas/categoria/:categoria
 * Retorna empresas filtradas por categoria
 */
router.get('/categoria/:categoria', async (req: Request, res: Response) => {
  try {
    const { categoria } = req.params as { categoria: string };

    if (!categoria || categoria.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Categoria é obrigatória',
      });
    }

    const response = await getEmpresasByCategoria(categoria);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas por categoria',
    });
  }
});

/**
 * GET /api/empresas/estado/:estado
 * Retorna empresas filtradas por estado
 */
router.get('/estado/:estado', async (req: Request, res: Response) => {
  try {
    const { estado } = req.params as { estado: string };

    if (!estado || estado.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Estado é obrigatório',
      });
    }

    const response = await getEmpresasByEstado(estado);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas por estado',
    });
  }
});

/**
 * GET /api/empresas/tamanho/:tamanho
 * Retorna empresas filtradas por tamanho
 */
router.get('/tamanho/:tamanho', async (req: Request, res: Response) => {
  try {
    const { tamanho } = req.params as {
      tamanho: 'pequena' | 'media' | 'grande';
    };

    if (!['pequena', 'media', 'grande'].includes(tamanho)) {
      return res.status(400).json({
        success: false,
        error: 'Tamanho inválido. Use: pequena, media ou grande',
      });
    }

    const response = await getEmpresasByTamanho(tamanho);

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar empresas por tamanho',
    });
  }
});

/**
 * GET /api/empresas/:id
 * Retorna os detalhes de uma empresa específica por ID
 * NOTA: Esta rota genérica DEVE ficar no final do arquivo!
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'ID da empresa é obrigatório',
      });
    }

    const response = await getEmpresaById(id);

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
});

export default router;