"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Import RequestHandler
const ingredientController_1 = require("../controllers/ingredientController");
const router = (0, express_1.Router)();
// Define ingredient routes
router.post('/', ingredientController_1.createIngredientHandler);
router.get('/', ingredientController_1.getAllIngredientsHandler);
router.get('/:id', ingredientController_1.getIngredientByIdHandler);
router.put('/:id', ingredientController_1.updateIngredientHandler); // Using PUT as specified, could also be PATCH
router.delete('/:id', ingredientController_1.deleteIngredientHandler);
router.patch('/:id/aliases', ingredientController_1.addAliasToIngredientHandler); // Route to add an alias
router.patch('/:ingredientId/stock', ingredientController_1.addStockToIngredientHandler); // Route to update stock
router.get('/:ingredientId/dependencies', ingredientController_1.getIngredientDependencies);
exports.default = router;
