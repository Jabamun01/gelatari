import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error-handling middleware.
 * Catches unhandled errors from all route handlers and returns a consistent
 * JSON error response. Place this LAST in the middleware chain.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
};

export default errorHandler;
