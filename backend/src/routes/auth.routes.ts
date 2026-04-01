import { Router } from 'express';
import {
  login,
  pinLogin,
  register,
  getMe,
  logout,
  changePassword,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/pin-login', pinLogin);
router.post('/register', register);
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);
router.put('/password', authMiddleware, changePassword);

export default router;
