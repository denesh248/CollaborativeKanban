import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { requireRoles } from '../middleware/role.middleware.js';
import { prisma } from '../lib/prisma.js';

import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/board.controller.js';

import {
  createColumn,
  updateColumn,
  deleteColumn,
} from '../controllers/column.controller.js';

import {
  createTask,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask,
} from '../controllers/task.controller.js';

import { getActivityLogs } from '../controllers/activity.controller.js';

const router = Router();

// Apply Authentication and Tenant Isolation to ALL routes under /api/tenants/:tenantId
router.use('/:tenantId', authMiddleware, tenantMiddleware);

// -----------------------------------------------------------------
// 1. Branch Verification & Security Endpoints
// -----------------------------------------------------------------
router.get('/:tenantId/verify', (req, res) => {
  res.status(200).json({
    success: true,
    message: `Access verified for branch: ${req.tenant.name}`,
    tenant: req.tenant,
    userId: req.user.id,
  });
});

router.get(
  '/:tenantId/admin-check',
  requireRoles(['ORG_ADMIN', 'TENANT_ADMIN']),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: `Admin permissions verified for ${req.tenant.name}`,
      role: req.tenant.role,
    });
  }
);

// -----------------------------------------------------------------
// 2. Branch Members (for task assignment)
// -----------------------------------------------------------------
router.get('/:tenantId/members', async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const organizationId = req.tenant.organizationId;

    const memberships = await prisma.membership.findMany({
      where: {
        OR: [{ tenantId }, { organizationId, role: 'ORG_ADMIN' }],
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    const membersMap = new Map();
    memberships.forEach((m) => {
      if (m.user && !membersMap.has(m.user.id)) {
        membersMap.set(m.user.id, {
          id: m.user.id,
          fullName: m.user.fullName,
          email: m.user.email,
          role: m.role,
        });
      }
    });

    return res.status(200).json({ members: Array.from(membersMap.values()) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve members' });
  }
});

// -----------------------------------------------------------------
// 3. Board CRUD Endpoints
// -----------------------------------------------------------------
router.get('/:tenantId/boards', getBoards);
router.post('/:tenantId/boards', requireRoles(['ORG_ADMIN', 'TENANT_ADMIN']), createBoard);
router.get('/:tenantId/boards/:boardId', getBoardById);
router.put('/:tenantId/boards/:boardId', requireRoles(['ORG_ADMIN', 'TENANT_ADMIN']), updateBoard);
router.delete('/:tenantId/boards/:boardId', requireRoles(['ORG_ADMIN', 'TENANT_ADMIN']), deleteBoard);

// -----------------------------------------------------------------
// 4. Column Endpoints
// -----------------------------------------------------------------
router.post(
  '/:tenantId/boards/:boardId/columns',
  requireRoles(['ORG_ADMIN', 'TENANT_ADMIN']),
  createColumn
);
router.put(
  '/:tenantId/columns/:columnId',
  requireRoles(['ORG_ADMIN', 'TENANT_ADMIN']),
  updateColumn
);
router.delete(
  '/:tenantId/columns/:columnId',
  requireRoles(['ORG_ADMIN', 'TENANT_ADMIN']),
  deleteColumn
);

// -----------------------------------------------------------------
// 5. Task CRUD & OCC Movement Endpoints
// -----------------------------------------------------------------
router.post('/:tenantId/boards/:boardId/tasks', createTask);
router.get('/:tenantId/tasks/:taskId', getTaskById);
router.put('/:tenantId/tasks/:taskId', updateTask);
router.patch('/:tenantId/tasks/:taskId/move', moveTask);
router.delete('/:tenantId/tasks/:taskId', deleteTask);

// -----------------------------------------------------------------
// 6. Activity Logs (Audit Trail)
// -----------------------------------------------------------------
router.get('/:tenantId/activity-logs', getActivityLogs);

export default router;
