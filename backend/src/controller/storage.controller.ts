import type { Request, Response } from 'express';
import * as storageService from '../services/storage.service.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';
import { createSuccessResponse } from '../shared/contracts/response.contract.js';

export async function uploadImage(req: Request, res: Response): Promise<Response> {
  const fields = req.body ?? {};
  if (
    Object.keys(fields).some(
      (field) => !['module', 'resourceId', 'purpose'].includes(field),
    )
  ) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Metadados de imagem não permitidos.',
    });
  }
  if (!req.file) {
    throw new AppError({
      status: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Arquivo de imagem obrigatório.',
    });
  }
  const result = await storageService.uploadImage(
    {
      module: fields.module,
      resourceId: fields.resourceId,
      purpose: fields.purpose,
      file: {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      },
    },
    { userId: req.userId!, role: req.userRole! },
  );
  return res.status(201).json(createSuccessResponse(result));
}

export async function getPresignedImageUrl(
  req: Request,
  res: Response,
): Promise<Response> {
  return res
    .status(200)
    .json(
      createSuccessResponse(
        await storageService.getPresignedImageUrl(String(req.params.imageId)),
      ),
    );
}
