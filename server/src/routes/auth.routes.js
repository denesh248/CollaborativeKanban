import { Router } from 'express';
import { login, register, getMe } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected route
router.get('/me', authMiddleware, getMe);

export default router;
