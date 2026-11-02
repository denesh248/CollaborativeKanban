import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { requireRoles } from '../middleware/role.middleware.js';

const router = Router();

// Test & verification endpoint: Verifies user has access to this tenant
router.get('/:tenantId/verify', authMiddleware, tenantMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: `Access verified for branch: ${req.tenant.name}`,
    tenant: req.tenant,
    userId: req.user.id,
  });
});

// Admin-only test endpoint: Only ORG_ADMIN or TENANT_ADMIN allowed
router.get(
  '/:tenantId/admin-check',
  authMiddleware,
  tenantMiddleware,
  requireRoles(['ORG_ADMIN', 'TENANT_ADMIN']),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: `Admin permissions verified for ${req.tenant.name}`,
      role: req.tenant.role,
    });
  }
);

export default router;
