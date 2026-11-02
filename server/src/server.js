import http from 'http';
import app from './app.js';
import { config } from './config/environment.js';
import { initSocket } from './socket.js';

const server = http.createServer(app);

// Initialize Socket.IO gateway
initSocket(server);

server.listen(config.PORT, () => {
  console.log(`🚀 Collaborative Kanban Server running on http://localhost:${config.PORT}`);
  console.log(`🏥 Health check: http://localhost:${config.PORT}/api/health`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
