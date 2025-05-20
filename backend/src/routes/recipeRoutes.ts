import { Router } from 'express'; // RequestHandler is no longer needed directly here
import asyncHandler from 'express-async-handler'; // Import asyncHandler
import {
  createRecipeHandler,
  getAllRecipesHandler,
  getRecipeByIdHandler,
  updateRecipeHandler,
  deleteRecipeHandler,
  finalizeRecipeProductionHandler, // Added import
  getRecipeDependenciesHandler, // Added import for the new handler
} from '../controllers/recipeController';

const router = Router();

// Define recipe routes
// Define recipe routes, wrapped with asyncHandler for proper error handling
router.post('/', asyncHandler(createRecipeHandler));
router.get('/', asyncHandler(getAllRecipesHandler));
router.get('/:id', asyncHandler(getRecipeByIdHandler));
router.put('/:id', asyncHandler(updateRecipeHandler)); // Or PATCH
router.delete('/:id', asyncHandler(deleteRecipeHandler));

// Route for finalizing recipe production
router.post('/:recipeId/finalize-production', asyncHandler(finalizeRecipeProductionHandler));

// Route for getting recipes that depend on a specific recipe
router.get('/:id/dependencies', asyncHandler(getRecipeDependenciesHandler));

export default router;