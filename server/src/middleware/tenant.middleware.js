import { prisma } from '../lib/prisma.js';

export const tenantMiddleware = async (req, res, next) => {
  const tenantId = req.params.tenantId;

  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant ID parameter is required' });
  }

  try {
    // 1. Fetch the tenant to verify it exists and retrieve its parent organization
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { organization: true },
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant (branch) not found' });
    }

    // 2. Check direct tenant-level membership
    let membership = await prisma.membership.findFirst({
      where: {
        userId: req.user.id,
        tenantId: tenantId,
      },
    });

    // 3. If no direct membership, check if the user is an ORG_ADMIN for this tenant's organization
    if (!membership) {
      membership = await prisma.membership.findFirst({
        where: {
          userId: req.user.id,
          organizationId: tenant.organizationId,
          role: 'ORG_ADMIN',
        },
      });
    }

    // 4. Reject if the user does not belong to this branch or organization
    if (!membership) {
      return res.status(403).json({
        message: 'Access denied: You do not have permission to access this branch.',
      });
    }

    // 5. Attach verified tenant context to the request
    req.tenant = {
      id: tenant.id,
      name: tenant.name,
      organizationId: tenant.organizationId,
      organizationName: tenant.organization.name,
      role: membership.role,
    };

    next();
  } catch (error) {
    console.error('Tenant authorization error:', error);
    return res.status(500).json({ message: 'Internal error verifying tenant access' });
  }
};
