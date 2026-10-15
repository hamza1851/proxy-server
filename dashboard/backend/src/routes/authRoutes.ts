import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const router = Router();

router.post('/auth/login', AuthController.login);
router.get('/auth/me', AuthController.getMe);

export default router;
