import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Base sub-routes
router.use('/', healthRoutes);

export default router;
