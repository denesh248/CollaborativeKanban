import express from 'express';
import cors from 'cors';
import { CLIENT_ORIGIN } from './config/environment.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'Collaborative Kanban API',
    description: 'Multi-Tenant Real-Time Collaborative Kanban Board API (Node.js + Express + JavaScript)',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me',
      },
      tenants: {
        verify: 'GET /api/tenants/:tenantId/verify',
      },
    },
  });
});

// API Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
