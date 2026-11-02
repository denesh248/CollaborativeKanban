export const getHealth = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Collaborative Kanban API Server is healthy and running.',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
};
