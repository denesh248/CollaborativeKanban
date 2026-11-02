import { prisma } from '../lib/prisma.js';

// -------------------------------------------------------------
// Get audit logs for the active branch
// -------------------------------------------------------------
export const getActivityLogs = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const limit = parseInt(req.query.limit || '50', 10);

    const logs = await prisma.activityLog.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    return res.status(200).json({ logs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return res.status(500).json({ message: 'Failed to retrieve activity history' });
  }
};
