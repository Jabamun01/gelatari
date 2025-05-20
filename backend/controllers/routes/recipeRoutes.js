"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // RequestHandler is no longer needed directly here
const express_async_handler_1 = __importDefault(require("express-async-handler")); // Import asyncHandler
const recipeController_1 = require("../controllers/recipeController");
const router = (0, express_1.Router)();
// Define recipe routes
// Define recipe routes, wrapped with asyncHandler for proper error handling
router.post('/', (0, express_async_handler_1.default)(recipeController_1.createRecipeHandler));
router.get('/', (0, express_async_handler_1.default)(recipeController_1.getAllRecipesHandler));
router.get('/:id', (0, express_async_handler_1.default)(recipeController_1.getRecipeByIdHandler));
router.put('/:id', (0, express_async_handler_1.default)(recipeController_1.updateRecipeHandler)); // Or PATCH
router.delete('/:id', (0, express_async_handler_1.default)(recipeController_1.deleteRecipeHandler));
// Route for finalizing recipe production
router.post('/:recipeId/finalize-production', (0, express_async_handler_1.default)(recipeController_1.finalizeRecipeProductionHandler));
// Route for getting recipes that depend on a specific recipe
router.get('/:id/dependencies', (0, express_async_handler_1.default)(recipeController_1.getRecipeDependenciesHandler));
exports.default = router;
