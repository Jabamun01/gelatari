import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth';
import User from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // OPTIONS requests don't need auth
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; tokenVersion?: number };

    // Verify user still exists in the database
    const user = await User.findById(decoded.userId).select('_id tokenVersion');
    if (!user) {
      res.status(401).json({ message: 'User no longer exists.' });
      return;
    }

    // Verify token version (invalidates tokens on password change)
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
      res.status(401).json({ message: 'Session expired. Please log in again.' });
      return;
    }

    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
    return;
  }
};

export default authMiddleware;
