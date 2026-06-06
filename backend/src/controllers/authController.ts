import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * POST /api/auth/login
 */
export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required.' });
      return;
    }

    const result = await authService.login(username, password);

    if (!result) {
      res.status(401).json({ message: 'Invalid username or password.' });
      return;
    }

    res.status(200).json(result);
  } catch (error: unknown) {
    console.error('Error in loginHandler:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * GET /api/auth/verify
 */
export const verifyHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'No token provided.', valid: false });
      return;
    }

    const result = await authService.verifyToken(token);
    if (!result) {
      res.status(401).json({ message: 'Invalid or expired token.', valid: false });
      return;
    }

    res.status(200).json({ valid: true, ...result });
  } catch (error: unknown) {
    console.error('Error in verifyHandler:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/change-password
 */
export const changePasswordHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ message: 'New password must be at least 8 characters.' });
      return;
    }

    if (!req.userId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const success = await authService.changePassword(req.userId, currentPassword, newPassword);

    if (!success) {
      res.status(400).json({ message: 'Current password is incorrect or user not found.' });
      return;
    }

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error: unknown) {
    console.error('Error in changePasswordHandler:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
