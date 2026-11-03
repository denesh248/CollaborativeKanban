import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { CLIENT_ORIGIN } from './config/environment.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Serve React frontend
const clientPath = path.resolve(__dirname, '../../client/dist');

app.use(express.static(clientPath));

// React SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }

  res.sendFile(path.join(clientPath, 'index.html'), (err) => {
    if (err) next(err);
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;