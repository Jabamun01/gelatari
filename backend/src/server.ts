import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express, { Request, Response } from 'express';
import connectDB from './config/db';
import cors from 'cors';
import ingredientRoutes from './routes/ingredientRoutes';
import recipeRoutes from './routes/recipeRoutes';
import defaultStepsRoutes from './routes/defaultStepsRoutes';
import authRoutes from './routes/authRoutes';
import iceCreamFlavorRoutes from './routes/iceCreamFlavorRoutes';
import { authMiddleware } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { seedDefaultUser } from './services/authService';

// ── Environment variable validation ────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const required = ['JWT_SECRET', 'DATABASE_URI'];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`FATAL: Environment variable ${key} is required in production.`);
      process.exit(1);
    }
  }
}

// Warn about default JWT secret in any environment
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'gelatari-dev-secret-change-in-production') {
  console.warn('WARNING: Using default JWT_SECRET. Set a strong random value in .env for security.');
}

// Warn about default password in any environment
if (!process.env.DEFAULT_PASSWORD || process.env.DEFAULT_PASSWORD === 'placeholder') {
  console.warn('WARNING: Using default placeholder password. Set DEFAULT_PASSWORD in .env for security.');
}
// ───────────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
// When behind a reverse proxy (Nginx), all requests are same-origin, so no CORS is needed.
// If CORS_ALLOWED_ORIGINS is set, only those origins are allowed (for cross-origin scenarios).
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    // If no origins are configured, allow all
    if (allowedOrigins.length === 0) return callback(null, true);
    // Check against the allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

// Health check (no auth)
app.get('/', (req: Request, res: Response) => {
  res.send('Server is running');
});

// Auth routes (no auth required — /login is public; /verify and /change-password
// have per-route auth middleware in the router)
app.use('/api/auth', authRoutes);

// Apply auth middleware to all other /api/ routes
app.use('/api', authMiddleware);

// Protected API routes
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/ice-cream', iceCreamFlavorRoutes);
app.use('/api/default-steps', defaultStepsRoutes);

// Centralized error handler (must be after all routes)
app.use(errorHandler);

// Connect to Database and Start Server
const startServer = async () => {
  await connectDB();
  await seedDefaultUser(); // Ensure default user exists
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();
