import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express, { Request, Response } from 'express';
import connectDB from './config/db';
import cors from 'cors';
import ingredientRoutes from './routes/ingredientRoutes'; // Import the ingredient router
import recipeRoutes from './routes/recipeRoutes'; // Import the recipe router
import defaultStepsRoutes from './routes/defaultStepsRoutes'; // Import the default steps router
const app = express();
// Use PORT from environment variables with a default fallback
const PORT = process.env.PORT || 3001;
// Apply middleware BEFORE defining routes
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON request bodies

// Basic health check route
// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.send('Server is running');
});

// Mount API routes
app.use('/api/ingredients', ingredientRoutes); // Mount ingredient routes
app.use('/api/recipes', recipeRoutes); // Mount recipe routes
app.use('/api/default-steps', defaultStepsRoutes); // Mount default steps routes

// Connect to Database and Start Server
const startServer = async () => {
  await connectDB(); // Connect to DB first
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();