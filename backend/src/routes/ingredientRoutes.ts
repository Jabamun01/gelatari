import { Router, RequestHandler } from 'express'; // Import RequestHandler
import {
  createIngredientHandler,
  getAllIngredientsHandler,
  getIngredientByIdHandler,
  updateIngredientHandler,
  deleteIngredientHandler,
} from '../controllers/ingredientController';

const router = Router();

// Define ingredient routes
router.post('/', createIngredientHandler as RequestHandler);
router.get('/', getAllIngredientsHandler as RequestHandler);
router.get('/:id', getIngredientByIdHandler as RequestHandler);
router.put('/:id', updateIngredientHandler as RequestHandler); // Using PUT as specified, could also be PATCH
router.delete('/:id', deleteIngredientHandler as RequestHandler);

export default router;