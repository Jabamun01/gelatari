import { Request, Response } from 'express';
import * as recipeService from '../services/recipeService';
import { IRecipe } from '../models/Recipe'; // Import IRecipe for type checking

// Define a type for the expected structure of recipe creation data in the request body
// This helps with validation and clarity. Exclude auto-generated fields.
type CreateRecipeRequestBody = Omit<IRecipe, '_id' | 'createdAt' | 'updatedAt'>;

// Define a type for the expected structure of recipe update data in the request body
type UpdateRecipeRequestBody = Partial<Omit<IRecipe, '_id' | 'createdAt' | 'updatedAt'>>;


/**
 * Handles the creation of a new recipe.
 * Validates input and calls the recipe service.
 */
export const createRecipeHandler = async (req: Request<{}, {}, CreateRecipeRequestBody>, res: Response): Promise<void> => {
  try {
    const recipeData = req.body;

    // --- Basic Validation ---
    // --- Basic Validation ---
    const ingredientsPresent = recipeData.ingredients && Array.isArray(recipeData.ingredients) && recipeData.ingredients.length > 0;
    const stepsPresent = recipeData.steps && Array.isArray(recipeData.steps) && recipeData.steps.length > 0;
    const linkedRecipesPresent = recipeData.linkedRecipes && Array.isArray(recipeData.linkedRecipes) && recipeData.linkedRecipes.length > 0;

    if (
      !recipeData || // Check if body exists
      !recipeData.name ||
      !recipeData.type ||
      // Require ingredients OR steps OR linkedRecipes to be present
      (!ingredientsPresent && !stepsPresent && !linkedRecipesPresent) ||
      recipeData.baseYieldGrams === undefined || typeof recipeData.baseYieldGrams !== 'number' || recipeData.baseYieldGrams <= 0 // Validate baseYieldGrams
    ) {
      res.status(400).json({ message: 'Missing or invalid required fields: name, type, baseYieldGrams (positive number). Recipe must contain ingredients, steps, or linked recipes.' });
      return; // Explicit return void
    }

    // Validate productionLossPercent if provided
    if (recipeData.productionLossPercent !== undefined && (typeof recipeData.productionLossPercent !== 'number' || recipeData.productionLossPercent < 0 || recipeData.productionLossPercent > 100)) {
      res.status(400).json({ message: 'ProductionLossPercent must be a number between 0 and 100 if provided.' });
      return; // Explicit return void
    }

    // Validate feina if provided (only for ice cream recipes)
    if (recipeData.feina !== undefined && !['Baix', 'Mitjà', 'Alt', 'Molt alt'].includes(recipeData.feina)) {
      res.status(400).json({ message: 'Feina must be one of Baix, Mitjà, Alt, Molt alt if provided.' });
      return; // Explicit return void
    }

    // Validate overrunOverridePercent if provided
    if (recipeData.overrunOverridePercent !== undefined && (typeof recipeData.overrunOverridePercent !== 'number' || isNaN(recipeData.overrunOverridePercent) || recipeData.overrunOverridePercent < 0)) {
      res.status(400).json({ message: 'OverrunOverridePercent must be a non-negative number if provided.' });
      return; // Explicit return void
    }

    // --- Type/Category Validation ---
    if (recipeData.type === 'ice cream recipe') {
        if (!recipeData.category || (recipeData.category !== 'ice cream' && recipeData.category !== 'sorbet')) {
            res.status(400).json({ message: 'Category ("ice cream" or "sorbet") is required and must be valid when type is "ice cream recipe"' });
            return; // Explicit return void
        }
    } else if (recipeData.type === 'not ice cream recipe') {
        if (recipeData.hasOwnProperty('category') && recipeData.category !== undefined && recipeData.category !== null) {
             // Ensure category is not provided if type is 'not ice cream recipe'
            res.status(400).json({ message: 'Category must not be provided when type is "not ice cream recipe"' });
            return; // Explicit return void
        }
        // Ensure category property is removed or undefined if type is not 'ice cream recipe'
        // Although the model might handle this, explicit controller logic is safer.
        // We don't need to modify recipeData here, just validate. Mongoose will ignore it if not in schema for this type.
    } else {
        // Invalid type value
        res.status(400).json({ message: 'Invalid recipe type specified. Must be "ice cream recipe" or "not ice cream recipe".' });
        return; // Explicit return void
    }

    // --- Ingredient/Linked Recipe Validation (Basic Structure) ---
    // Validate ingredients structure
    for (const ing of recipeData.ingredients) {
        if (!ing.ingredient || typeof ing.ingredient !== 'string' || !ing.amountGrams || typeof ing.amountGrams !== 'number' || ing.amountGrams < 0) {
            res.status(400).json({ message: 'Invalid ingredient format. Each ingredient must have a valid ingredient ID (string) and a non-negative amountGrams (number).' });
            return; // Explicit return void
        }
    }
    // Validate linked recipes structure if present
    if (recipeData.linkedRecipes && Array.isArray(recipeData.linkedRecipes)) {
        for (const linked of recipeData.linkedRecipes) {
            if (!linked.recipe || typeof linked.recipe !== 'string' || !linked.amountGrams || typeof linked.amountGrams !== 'number' || linked.amountGrams < 0) {
                res.status(400).json({ message: 'Invalid linked recipe format. Each linked recipe must have a valid recipe ID (string) and a non-negative amountGrams (number).' });
                return; // Explicit return void
            }
        }
    }


    // Call service function with validated data
    const newRecipe = await recipeService.createRecipe(recipeData);
    // Service layer handles population, return the result
    res.status(201).json(newRecipe);

  } catch (error: unknown) {
    // Log the detailed error for server-side debugging
    console.error('Error in createRecipeHandler:', error);

    if (error instanceof Error) {
      // Check for specific Mongoose validation errors
      if (error.name === 'ValidationError') {
          // Extract meaningful messages from Mongoose validation error
          const mongooseError = error as any;
          const errors = Object.values(mongooseError.errors).map((el: any) => el.message);
          res.status(400).json({ message: 'Validation failed.', errors });
          return;
      }
      // Check for errors thrown by the service layer
      if (error.message.includes('Failed to create recipe')) {
          res.status(400).json({ message: 'Failed to create recipe. Check input data.', details: error.message });
          return;
      }
    }
    // Generic internal server error
    res.status(500).json({ message: 'Internal server error during recipe creation' });
  }
};

/**
 * Handles fetching all recipes, with optional filtering by type and searching by name.
 */
export const getAllRecipesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract and validate query parameters
    const { type, searchTerm } = req.query;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 0;

    // Validate page and limit
    if (page < 1 || limit < 0) {
        res.status(400).json({ message: 'Page must be a positive integer and limit must be a non-negative integer.' });
        return;
    }

    const filter: recipeService.RecipeFilter = {};

    // Validate 'type' query parameter
    if (type) {
        if (typeof type !== 'string' || (type !== 'ice cream recipe' && type !== 'not ice cream recipe')) {
            res.status(400).json({ message: 'Invalid value for "type" query parameter. Must be "ice cream recipe" or "not ice cream recipe".' });
            return; // Explicit return void
        }
        filter.type = type;
    }

    // Validate 'searchTerm' query parameter
    if (searchTerm) {
        if (typeof searchTerm !== 'string' || searchTerm.trim() === '') {
             res.status(400).json({ message: 'Invalid value for "searchTerm" query parameter. Must be a non-empty string.' });
             return; // Explicit return void
        }
        filter.searchTerm = searchTerm.trim();
    }

    const { recipes, totalCount } = await recipeService.getAllRecipes(filter, page, limit);
    // Set pagination header for frontend
    res.setHeader('x-total-count', totalCount.toString());
    // Service returns populated recipes
    res.status(200).json(recipes);

  } catch (error: unknown) {
    console.error('Error in getAllRecipesHandler:', error);
    res.status(500).json({ message: 'Internal server error fetching recipes' });
  }
};

/**
 * Handles fetching a single recipe by its ID.
 */
export const getRecipeByIdHandler = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // ID validation is handled by the service layer (isValidObjectId),
    // but a basic check here is fine too.
    if (!id) {
        res.status(400).json({ message: 'Recipe ID parameter is required' });
        return; // Explicit return void
    }

    const recipe = await recipeService.getRecipeById(id);

    if (!recipe) {
      // Service returns null if not found or invalid ID format
      res.status(404).json({ message: 'Recipe not found or invalid ID' });
      return; // Explicit return void
    }

    // Service returns populated recipe
    res.status(200).json(recipe);

  } catch (error: unknown) {
    console.error(`Error in getRecipeByIdHandler for ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Internal server error fetching recipe' });
  }
};

/**
 * Handles updating an existing recipe by its ID.
 */
export const updateRecipeHandler = async (req: Request<{ id: string }, {}, UpdateRecipeRequestBody>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

     if (!id) {
        res.status(400).json({ message: 'Recipe ID parameter is required for update' });
        return; // Explicit return void
    }

    // Basic validation: Ensure there's something to update
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      res.status(400).json({ message: 'No update data provided in the request body' });
      return; // Explicit return void
    }

    // --- Optional: Add specific validation for updates if needed ---
    // Example: Prevent changing 'type' if it leads to invalid 'category' state.
    // Mongoose validation (runValidators: true in service) should catch most schema issues.
    // However, complex cross-field validation might be needed here.
    // For instance, if 'type' is changed to 'not ice cream recipe', ensure 'category' is unset.
    if (updates.type === 'not ice cream recipe' && updates.hasOwnProperty('category')) {
        // If explicitly setting type to non-ice cream, category should not be present or should be nullified.
        // Mongoose might handle this based on the conditional 'required', but being explicit can be safer.
        // Consider if the service layer should handle unsetting category in this case.
        // For now, rely on Mongoose validation triggered by the service.
    }
    if (updates.type === 'ice cream recipe' && (!updates.category && !req.body.hasOwnProperty('category'))) {
        // If updating type to 'ice cream recipe', category becomes required.
        // This needs careful handling - check if the existing document already has a category
        // or if the update itself provides one. This logic is complex and often best
        // handled by fetching the document first or relying heavily on robust schema validation.
        // Let's rely on Mongoose validation for now.
    }
    // Validate productionLossPercent if provided
    if (updates.productionLossPercent !== undefined && (typeof updates.productionLossPercent !== 'number' || updates.productionLossPercent < 0 || updates.productionLossPercent > 100)) {
      res.status(400).json({ message: 'ProductionLossPercent must be a number between 0 and 100 if provided.' });
      return; // Explicit return void
    }

    // Validate feina if provided
    if (updates.feina !== undefined && !['Baix', 'Mitjà', 'Alt', 'Molt alt'].includes(updates.feina)) {
      res.status(400).json({ message: 'Feina must be one of Baix, Mitjà, Alt, Molt alt if provided.' });
      return; // Explicit return void
    }

    // Validate overrunOverridePercent if provided
    if (updates.overrunOverridePercent !== undefined && (typeof updates.overrunOverridePercent !== 'number' || isNaN(updates.overrunOverridePercent) || updates.overrunOverridePercent < 0)) {
      res.status(400).json({ message: 'OverrunOverridePercent must be a non-negative number if provided.' });
      return; // Explicit return void
    }

    // Validate ingredient/linked recipe structures if they are part of the update
     if (updates.ingredients && Array.isArray(updates.ingredients)) {
        for (const ing of updates.ingredients) {
            if (!ing.ingredient || typeof ing.ingredient !== 'string' || !ing.amountGrams || typeof ing.amountGrams !== 'number' || ing.amountGrams < 0) {
                res.status(400).json({ message: 'Invalid ingredient format in update. Each ingredient must have a valid ingredient ID (string) and a non-negative amountGrams (number).' });
                return; // Explicit return void
            }
        }
    }
    if (updates.linkedRecipes && Array.isArray(updates.linkedRecipes)) {
        for (const linked of updates.linkedRecipes) {
             if (!linked.recipe || typeof linked.recipe !== 'string' || !linked.amountGrams || typeof linked.amountGrams !== 'number' || linked.amountGrams < 0) {
                res.status(400).json({ message: 'Invalid linked recipe format in update. Each linked recipe must have a valid recipe ID (string) and a non-negative amountGrams (number).' });
                return; // Explicit return void
            }
        }
    }


    const updatedRecipe = await recipeService.updateRecipe(id, updates);

    if (!updatedRecipe) {
      // Service returns null if not found, invalid ID, or validation error during update
      // We might want more specific error messages based on why it failed.
      // Let's check if the recipe exists first to distinguish 404 from 400.
      const exists = await recipeService.getRecipeById(id); // Re-check existence
      if (!exists) {
          res.status(404).json({ message: 'Recipe not found for update' });
          return; // Explicit return void
      } else {
          // If it exists but update failed, it's likely a validation error
          res.status(400).json({ message: 'Failed to update recipe. Check input data or schema constraints.' });
          return; // Explicit return void
      }
    }

    // Service returns populated updated recipe
    res.status(200).json(updatedRecipe);

  } catch (error: unknown) {
     console.error(`Error in updateRecipeHandler for ID ${req.params.id}:`, error);

     if (error instanceof Error) {
      // Check for specific Mongoose validation errors
      if (error.name === 'ValidationError') {
          const mongooseError = error as any;
          const errors = Object.values(mongooseError.errors).map((el: any) => el.message);
          res.status(400).json({ message: 'Validation failed during update.', errors });
          return;
      }
     }
    // Generic internal server error
    res.status(500).json({ message: 'Internal server error updating recipe' });
  }
};

/**
 * Handles deleting a recipe by its ID.
 */
export const deleteRecipeHandler = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ message: 'Recipe ID parameter is required for deletion' });
        return; // Explicit return void
    }

    const result = await recipeService.deleteRecipe(id);

    if (!result) {
      // Service returns null if not found or invalid ID
      res.status(404).json({ message: 'Recipe not found for deletion or invalid ID' });
      return; // Explicit return void
    }

    // Check if the result indicates dependencies
    if ('dependencies' in result) {
      // Type guard to ensure result is RecipeDeletionDependencies
      const dependencyResult = result as recipeService.RecipeDeletionDependencies;
      res.status(409).json({
        message: 'Recipe cannot be deleted because it is a dependency for other recipes.',
        dependencies: dependencyResult.dependencies,
      });
      return; // Explicit return void
    }

    // If result is null, it was already handled above (not found)
    if (!result) {
      res.status(404).json({ message: 'Recipe not found for deletion or invalid ID' });
      return;
    }

    // Here result must be the deleted IRecipe document (not null, not dependencies)
    const deletedRecipeDocument = result;

    // Send back a success message with the ID of the deleted recipe
    res.status(200).json({ message: 'Recipe deleted successfully', deletedRecipeId: deletedRecipeDocument._id });
    // Alternatively, for 204 No Content:
    // res.status(204).send();

  } catch (error: unknown) {
    console.error(`Error in deleteRecipeHandler for ID ${req.params.id}:`, error);
    if (error instanceof Error && error.message.includes('Failed to delete recipe')) {
        res.status(500).json({ message: 'Internal server error during recipe deletion.', details: error.message });
    } else {
        res.status(500).json({ message: 'An unexpected error occurred while deleting the recipe.' });
    }
  }
};

/**
 * Handles duplicating a recipe.
 */
export const duplicateRecipeHandler = async (req: Request<{ recipeId: string }>, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;

    if (!recipeId) {
      res.status(400).json({ message: 'Recipe ID parameter is required.' });
      return;
    }

    const newRecipe = await recipeService.duplicateRecipe(recipeId);

    if (!newRecipe) {
      res.status(404).json({ message: `Recipe with ID ${recipeId} not found.` });
      return;
    }

    res.status(201).json(newRecipe);
  } catch (error: unknown) {
    console.error(`Error duplicating recipe ${req.params.recipeId}:`, error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to duplicate recipe.' });
  }
};

/**
 * Handles finalizing the production of a recipe, triggering ingredient stock deduction.
 * For ice cream recipes, mix stock is auto-incremented on the linked flavor.
 */
export const finalizeRecipeProductionHandler = async (req: Request<{ recipeId: string }>, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const scaleFactor = typeof req.body.scaleFactor === 'number' ? req.body.scaleFactor : 1;

    if (!recipeId) {
      res.status(400).json({ message: 'Recipe ID parameter is required.' });
      return;
    }

    const finalizedRecipe = await recipeService.finalizeRecipeProduction(recipeId, scaleFactor);

    if (!finalizedRecipe) {
      res.status(404).json({ message: `Recipe with ID ${recipeId} not found or could not be finalized.` });
      return;
    }

    res.status(200).json({ message: 'Recipe production finalized successfully. Ingredient stock updated.', recipe: finalizedRecipe });

  } catch (error: unknown) {
    console.error(`Error in finalizeRecipeProductionHandler for recipe ID ${req.params.recipeId}:`, error);
    if (error instanceof Error) {
      if (error.message.includes('Recipe not found')) {
        res.status(404).json({ message: error.message });
        return;
      } else if (error.message.includes('Failed to finalize recipe production')) {
          res.status(500).json({ message: 'Failed to finalize recipe production.', details: error.message });
          return;
      }
    }
    res.status(500).json({ message: 'Internal server error during recipe finalization.' });
  }
};

/**
 * Handles fetching all recipes that depend on a specific recipe (i.e., use it as a linked recipe).
 */
export const getRecipeDependenciesHandler = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ message: 'Recipe ID parameter is required to find dependencies.' });
        return;
    }

    // ID validation (format) is handled by the service layer, but a check here is fine.
    // The service will return [] for invalid ID format if not throwing an error.

    const dependentRecipes = await recipeService.getDependentParentRecipes(id);

    // The service function getDependentParentRecipes is expected to return an array.
    // If the recipe has no dependencies, it will be an empty array.
    // If the recipe ID is invalid or not found, it might also return an empty array or throw.
    // The current service implementation returns [] for invalid ID format.

    res.status(200).json(dependentRecipes);

  } catch (error: unknown) {
    console.error(`Error in getRecipeDependenciesHandler for recipe ID ${req.params.id}:`, error);
    if (error instanceof Error && error.message.includes('Failed to fetch dependent parent recipes')) {
        res.status(500).json({ message: 'Internal server error fetching recipe dependencies.', details: error.message });
    } else {
        res.status(500).json({ message: 'An unexpected error occurred while fetching recipe dependencies.' });
    }
  }
};