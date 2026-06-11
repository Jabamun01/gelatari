import { Router } from 'express';
import {
  createRecipeHandler,
  getAllRecipesHandler,
  getRecipeByIdHandler,
  updateRecipeHandler,
  deleteRecipeHandler,
  duplicateRecipeHandler,
  finalizeRecipeProductionHandler,
  getRecipeDependenciesHandler,
} from '../controllers/recipeController';

const router = Router();

// Define recipe routes (Express 5 handles async errors natively)
router.post('/', createRecipeHandler);
router.get('/', getAllRecipesHandler);
router.get('/:id', getRecipeByIdHandler);
router.put('/:id', updateRecipeHandler);
router.delete('/:id', deleteRecipeHandler);

// Route for duplicating a recipe
router.post('/:recipeId/duplicate', duplicateRecipeHandler);

// Route for finalizing recipe production
router.post('/:recipeId/finalize-production', finalizeRecipeProductionHandler);

// Route for getting recipes that depend on a specific recipe
router.get('/:id/dependencies', getRecipeDependenciesHandler);

export default router;
