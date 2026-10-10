import { Router } from 'express';
import * as userController from '../controller/user.controller.js';
import authMiddleware from '../middlewares/auth.js';

const router = Router();

router.post('/login', userController.login);
router.post(['/forgot-password', '/esqueci-senha'], userController.forgotPassword);
router.post(['/reset-password', '/redefinir-senha'], userController.resetPassword);
router.get('/profile', authMiddleware, userController.profile);
router.post('/home', authMiddleware, userController.home);

export default router;
