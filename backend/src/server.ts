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

// CORS Configuration
// const allowedOriginsDev = ['http://localhost:5173', 'http://localhost:3000']; // Add other dev origins if needed
// const corsOptions = {
//   origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
//     if (process.env.NODE_ENV === 'production') {
//       const prodOrigin = process.env.CORS_ALLOWED_ORIGIN;
//       if (prodOrigin && origin === prodOrigin) {
//         callback(null, true);
//       } else if (!prodOrigin && !origin) {
//         // Allow requests with no origin (like mobile apps or curl requests) in production if CORS_ALLOWED_ORIGIN is not set
//         // For stricter control, you might want to disallow this or make it configurable.
//         callback(null, true);
//       }
//       else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     } else {
//       // Development: allow from defined list or if no origin (e.g. curl, Postman)
//       if (!origin || (origin && allowedOriginsDev.includes(origin))) {
//         callback(null, true);
//       } else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     }
//   },
//   credentials: true, // If you need to allow cookies or authorization headers
// };

// Apply middleware BEFORE defining routes
// app.use(cors(corsOptions)); // Enable CORS with dynamic options
app.use(cors()); // Enable CORS with default settings
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