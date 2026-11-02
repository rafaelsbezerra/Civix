import { Router } from 'express';
import * as userController from '../controller/user.controller.js';
import authMiddleware from '../middlewares/auth.js';

const router = Router();

router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post(['/forgot-password', '/esqueci-senha'], userController.forgotPassword);
router.post(['/reset-password', '/redefinir-senha'], userController.resetPassword);
router.get(['/profile', '/me'], authMiddleware, userController.profile);
router.get('/home', authMiddleware, userController.home);

export default router;