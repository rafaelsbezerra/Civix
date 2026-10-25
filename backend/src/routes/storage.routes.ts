import { Router } from 'express';
import * as storageController from '../controller/storage.controller.js';
import authMiddleware from '../middlewares/auth.js';

const router = Router();

// Router não montado: handlers, parser multipart e autorização estão pendentes.
router.post('/images', authMiddleware, storageController.uploadImage);
router.get('/images/:imageId/url', storageController.getPresignedImageUrl);

export default router;
