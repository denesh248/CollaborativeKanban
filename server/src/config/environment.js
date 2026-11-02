import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_collaborative_kanban_2026';
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, '');
  return (
    allowedOrigins.includes('*') ||
    allowedOrigins.includes(normalized) ||
    normalized.endsWith('.onrender.com') ||
    normalized.includes('localhost') ||
    normalized.includes('127.0.0.1')
  );
};

export const CLIENT_ORIGIN = (origin, callback) => {
  callback(null, isOriginAllowed(origin));
};

export const config = {
  PORT,
  JWT_SECRET,
  CLIENT_ORIGIN,
  NODE_ENV,
};
