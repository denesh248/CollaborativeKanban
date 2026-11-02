import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tenantRoutes from './tenant.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

// Mount API sub-routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);

export default router;
