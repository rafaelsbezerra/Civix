import { Router } from 'express';
import multer from 'multer';
import * as storageController from '../controller/storage.controller.js';
import authMiddleware from '../middlewares/auth.js';
import { AppError } from '../shared/errors/app.error.js';
import { ErrorCode } from '../shared/errors/error.code.js';

const router = Router();
const receive = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10000000,
    files: 1,
    fields: 3,
    fieldSize: 200,
    parts: 4,
  },
}).single('file');

router.post(
  '/images',
  authMiddleware,
  (req, res, next) => {
    if (req.userRole !== 'admin_empresa' && req.userRole !== 'super_admin') {
      return next(
        new AppError({
          status: 403,
          code: ErrorCode.FORBIDDEN,
          message: 'Perfil sem permissão para enviar imagens.',
        }),
      );
    }
    receive(req, res, (error) => {
      if (!error) {
        return next();
      }
      next(
        new AppError({
          status:
            error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
              ? 413
              : 400,
          code: ErrorCode.VALIDATION_ERROR,
          message:
            'Upload inválido. Envie uma imagem de até 10 MB e os metadados permitidos.',
        }),
      );
    });
  },
  storageController.uploadImage,
);
router.get('/images/:imageId/url', storageController.getPresignedImageUrl);
export default router;
