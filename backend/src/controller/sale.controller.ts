import type { Request, Response } from 'express';
import * as saleService from '../services/sale.service.js';
import { createSuccessResponse } from '../shared/contracts/response.contract.js';

export async function listPlatformSales(req: Request, res: Response) {
  return res.json(await saleService.listPlatformSales(req.authenticatedUser!.id, req.query));
}
export async function getPlatformSale(req: Request, res: Response) {
  return res.json(createSuccessResponse(await saleService.getPlatformSale(req.authenticatedUser!.id, String(req.params.saleId))));
}
export async function createManualSale(req: Request, res: Response) {
  return res.status(201).json(createSuccessResponse(await saleService.createManualSale(req.authenticatedUser!.id, req.body)));
}
export async function deleteSaleById(req: Request, res: Response) {
  await saleService.deleteSaleById(req.authenticatedUser!.id, String(req.params.saleId));
  return res.status(204).end();
}
