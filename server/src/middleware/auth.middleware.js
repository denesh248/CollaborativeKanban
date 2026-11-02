import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/environment.js';

export const authMiddleware = (req, res, next) => {
  // Read Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. Missing Bearer token.' });
  }

  // Extract token string
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach consistent user ID to req.user
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};
