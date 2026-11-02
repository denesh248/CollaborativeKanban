import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_collaborative_kanban_2026';
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const config = {
  PORT,
  JWT_SECRET,
  CLIENT_ORIGIN,
  NODE_ENV,
};
