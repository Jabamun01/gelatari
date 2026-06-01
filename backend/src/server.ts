import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express, { Request, Response } from 'express';
import connectDB from './config/db';
import cors from 'cors';
import ingredientRoutes from './routes/ingredientRoutes';
import recipeRoutes from './routes/recipeRoutes';
import defaultStepsRoutes from './routes/defaultStepsRoutes';
import authRoutes from './routes/authRoutes';
import { authMiddleware } from './middleware/authMiddleware';
import { seedDefaultUser } from './services/authService';

const app = express();
const PORT = process.env.PORT || 3001;

// Global middleware
app.use(cors());
app.use(express.json());

// Health check (no auth)
app.get('/', (req: Request, res: Response) => {
  res.send('Server is running');
});

// Auth routes (no auth required — they handle login themselves)
app.use('/api/auth', authRoutes);

// Apply auth middleware to all other /api/ routes
app.use('/api', authMiddleware);

// Protected API routes
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/default-steps', defaultStepsRoutes);

// Connect to Database and Start Server
const startServer = async () => {
  await connectDB();
  await seedDefaultUser(); // Ensure default user exists
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();
