export const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    // req.tenant is attached by tenantMiddleware
    if (!req.tenant || !req.tenant.role) {
      return res.status(403).json({ message: 'Role information not found. Tenant verification required.' });
    }

    // Check if user's role in this tenant matches allowed roles
    if (!allowedRoles.includes(req.tenant.role)) {
      return res.status(403).json({
        message: `Action denied: Requires one of [${allowedRoles.join(', ')}], but your role is '${req.tenant.role}'.`,
      });
    }

    next();
  };
};
