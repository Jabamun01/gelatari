import { Router } from 'express'; // RequestHandler is no longer needed directly here
import asyncHandler from 'express-async-handler'; // Import asyncHandler
import {
  createRecipeHandler,
  getAllRecipesHandler,
  getRecipeByIdHandler,
  updateRecipeHandler,
  deleteRecipeHandler,
} from '../controllers/recipeController';

const router = Router();

// Define recipe routes
// Define recipe routes, wrapped with asyncHandler for proper error handling
router.post('/', asyncHandler(createRecipeHandler));
router.get('/', asyncHandler(getAllRecipesHandler));
router.get('/:id', asyncHandler(getRecipeByIdHandler));
router.put('/:id', asyncHandler(updateRecipeHandler)); // Or PATCH
router.delete('/:id', asyncHandler(deleteRecipeHandler));

export default router;