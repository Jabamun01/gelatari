import { Request, Response } from 'express';
import * as ingredientService from '../services/ingredientService';
import Ingredient from '../models/Ingredient'; // Import the model for checking duplicates
import { Types } from 'mongoose'; // Needed for ObjectId validation

// Basic validation helper
const isValidObjectId = (id: string): boolean => Types.ObjectId.isValid(id);

export const createIngredientHandler = async (req: Request, res: Response) => {
  try {
    const { name, aliases, quantityInStock, mermaPercent, costPerKg } = req.body;

    // Basic input validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Ingredient name is required and must be a non-empty string.' });
    }
    if (aliases !== undefined && (!Array.isArray(aliases) || !aliases.every(a => typeof a === 'string' && a.trim() !== ''))) {
        return res.status(400).json({ message: 'Aliases must be an array of non-empty strings if provided.' });
    }
    if (quantityInStock !== undefined && (typeof quantityInStock !== 'number' || isNaN(quantityInStock))) {
        return res.status(400).json({ message: 'QuantityInStock must be a number if provided.' });
    }
    if (mermaPercent !== undefined && (typeof mermaPercent !== 'number' || isNaN(mermaPercent) || mermaPercent < 0 || mermaPercent > 100)) {
        return res.status(400).json({ message: 'MermaPercent must be a number between 0 and 100 if provided.' });
    }

    const trimmedName = name.trim();
    const finalAliases = aliases ? aliases.map((a: string) => a.trim()).filter((a: string) => a) : []; // Trim and filter empty aliases
    const finalQuantityInStock = quantityInStock !== undefined ? Number(quantityInStock) : undefined;
    const finalMermaPercent = mermaPercent !== undefined ? Number(mermaPercent) : undefined;
    const finalCostPerKg = costPerKg !== undefined && costPerKg !== null ? Number(costPerKg) : undefined;

    // Check if name or any alias conflicts with existing names or aliases (case-insensitive)
    const potentialConflicts = [trimmedName, ...finalAliases];
    const conflictQuery = potentialConflicts.map(term => ({
        $or: [
            { name: { $regex: `^${term}$`, $options: 'i' } },
            { aliases: { $regex: `^${term}$`, $options: 'i' } }
        ]
    }));

    if (conflictQuery.length > 0) {
        const existingConflict = await Ingredient.findOne({ $or: conflictQuery });
        if (existingConflict) {
            // Find which term caused the conflict for a better error message
            let conflictingTerm = potentialConflicts.find(term =>
                existingConflict.name.toLowerCase() === term.toLowerCase() ||
                existingConflict.aliases.some((alias: string) => alias.toLowerCase() === term.toLowerCase())
            );
            return res.status(409).json({ message: `The name or alias "${conflictingTerm || trimmedName}" conflicts with existing ingredient "${existingConflict.name}".` });
        }
    }


    const ingredientData = {
        name: trimmedName,
        aliases: finalAliases,
        quantityInStock: finalQuantityInStock,
        mermaPercent: finalMermaPercent,
        costPerKg: finalCostPerKg,
    };

    // The conflict check above already handles duplicates based on name and aliases.
    // We keep the service call which has its own final check.

    // Proceed to create
    const newIngredient = await ingredientService.createIngredient(
        ingredientData.name,
        ingredientData.aliases,
        ingredientData.quantityInStock,
        ingredientData.mermaPercent,
        ingredientData.costPerKg
    );
    res.status(201).json(newIngredient);
  } catch (error: unknown) {
    console.error('Caught error during ingredient creation:', error);
    // Handle potential duplicate key error from MongoDB (code 11000) as a fallback, return 409
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
        return res.status(409).json({ message: `Ingredient creation failed due to a conflict (e.g., name or alias already exists).` });
    }
    console.error('Error creating ingredient (unhandled):', error);
    res.status(500).json({ message: 'Internal server error while creating ingredient.' });
  }
};

export const getAllIngredientsHandler = async (req: Request, res: Response) => {
  try {
    // Extract filter (searchTerm) and pagination parameters from query string
    const searchTerm = typeof req.query.searchTerm === 'string' ? req.query.searchTerm : undefined;
    const page = parseInt(req.query.page as string, 10) || 1; // Default to page 1
    const limit = parseInt(req.query.limit as string, 10) || 10; // Default to 10 items per page

    // Validate page and limit
    if (page < 1 || limit < 1) {
        return res.status(400).json({ message: 'Page and limit must be positive integers.' });
    }

    // Call the service function with search term and pagination parameters
    const result = await ingredientService.getAllIngredients(searchTerm, page, limit);

    // Structure the response with pagination metadata
    res.status(200).json({
        data: result.ingredients,
        pagination: {
            currentPage: page,
            totalPages: result.totalPages,
            totalItems: result.totalCount,
            limit: limit,
        },
    });
  } catch (error: unknown) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ message: 'Internal server error while fetching ingredients.' });
  }
};

export const getIngredientByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid ingredient ID format.' });
    }

    const ingredient = await ingredientService.getIngredientById(id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found.' });
    }
    res.status(200).json(ingredient);
  } catch (error: unknown) {
    console.error('Error fetching ingredient by ID:', error);
    res.status(500).json({ message: 'Internal server error while fetching ingredient by ID.' });
  }
};

export const updateIngredientHandler = async (req: Request, res: Response, next: Function) => {
  try {
    const { id } = req.params;
    const { name, aliases, quantityInStock, mermaPercent, costPerKg } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ingredient ID format.' });
    }

    // --- Input Validation ---
    const updateData: { name?: string; aliases?: string[]; quantityInStock?: number; mermaPercent?: number; costPerKg?: number } = {};
    let hasValidUpdateField = false;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Ingredient name must be a non-empty string if provided.' });
      }
      updateData.name = name.trim();
      hasValidUpdateField = true;
    }

    if (aliases !== undefined) {
      if (!Array.isArray(aliases) || !aliases.every(a => typeof a === 'string')) {
        return res.status(400).json({ message: 'Aliases must be an array of strings if provided.' });
      }
      updateData.aliases = aliases;
      hasValidUpdateField = true;
    }

    if (quantityInStock !== undefined) {
      if (typeof quantityInStock !== 'number' || isNaN(quantityInStock)) {
        return res.status(400).json({ message: 'QuantityInStock must be a number if provided.' });
      }
      updateData.quantityInStock = quantityInStock;
      hasValidUpdateField = true;
    }

    if (mermaPercent !== undefined) {
      if (typeof mermaPercent !== 'number' || isNaN(mermaPercent) || mermaPercent < 0 || mermaPercent > 100) {
        return res.status(400).json({ message: 'MermaPercent must be a number between 0 and 100 if provided.' });
      }
      updateData.mermaPercent = mermaPercent;
      hasValidUpdateField = true;
    }

    if (costPerKg !== undefined) {
      if (costPerKg === null) {
        // null means unset / clear the price
        updateData.costPerKg = null as any;
        hasValidUpdateField = true;
      } else if (typeof costPerKg !== 'number' || isNaN(costPerKg) || costPerKg < 0) {
        return res.status(400).json({ message: 'CostPerKg must be a non-negative number if provided.' });
      } else {
        updateData.costPerKg = costPerKg;
        hasValidUpdateField = true;
      }
    }

    if (!hasValidUpdateField && Object.keys(req.body).length > 0) {
        return res.status(400).json({ message: 'No valid fields provided for update. Allowed fields are: name, aliases, quantityInStock, mermaPercent, costPerKg.' });
    }
    // If req.body is empty, service layer will handle it by returning current ingredient.

    // --- Service Call ---
    const updatedIngredient = await ingredientService.updateIngredientById(id, updateData);

    if (!updatedIngredient) {
      return res.status(404).json({ message: 'Ingredient not found.' });
    }

    res.status(200).json(updatedIngredient);

  } catch (error: unknown) {
    console.error(`Error in updateIngredientHandler for ID ${req.params.id}:`, error);

    if (error instanceof Error) {
      // Specific error handling based on service layer exceptions
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      if (error.message.startsWith('Validation failed')) {
        return res.status(400).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: 'Internal server error while updating ingredient.' });
  }
};

export const deleteIngredientHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid ingredient ID format.' });
    }

    const deletedIngredient = await ingredientService.deleteIngredient(id);
    // The service now throws an error if not found, so a null check here is less critical
    // but kept for robustness if service logic changes.
    if (!deletedIngredient) {
      // This case should ideally be covered by the service throwing a 404 error.
      return res.status(404).json({ message: 'Ingredient not found for deletion.' });
    }
    res.status(200).json({ message: 'Ingredient deleted successfully.', ingredient: deletedIngredient });
  } catch (error: unknown) {
    console.error('Error deleting ingredient:', error instanceof Error ? error.message : error);
    // Handle specific operational errors thrown by the service
    const operationalError = error as { isOperational?: boolean; statusCode?: number; details?: unknown; message?: string };
    if (operationalError.isOperational) {
      if (operationalError.statusCode === 409) {
        return res.status(409).json({
          message: operationalError.message,
          details: operationalError.details,
        });
      }
      if (operationalError.statusCode === 404) {
        return res.status(404).json({ message: operationalError.message });
      }
    }
    if (error instanceof Error && error.message.startsWith('Invalid ingredient ID format')) {
        return res.status(400).json({ message: error.message });
    }
    const errMsg = error instanceof Error ? error.message : 'Internal server error while deleting ingredient.';
    res.status(500).json({ message: errMsg });
  }
};

export const addAliasToIngredientHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { alias } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid ingredient ID format.' });
        }

        if (!alias || typeof alias !== 'string' || alias.trim() === '') {
            return res.status(400).json({ message: 'Alias is required and must be a non-empty string.' });
        }

        const trimmedAlias = alias.trim();

        const updatedIngredient = await ingredientService.addAliasToIngredient(id, trimmedAlias);

        if (!updatedIngredient) {
            // Service returns null if ingredient not found OR if alias already exists on this ingredient (which is not an error state here)
            // We need to re-fetch to check the reason
             const ingredient = await ingredientService.getIngredientById(id);
             if (!ingredient) {
                 return res.status(404).json({ message: 'Ingredient not found.' });
             }
             // Check if alias already exists (case-insensitive) on this ingredient
             const lowerCaseAlias = trimmedAlias.toLowerCase();
             if (ingredient.name.toLowerCase() === lowerCaseAlias || ingredient.aliases.some(a => a.toLowerCase() === lowerCaseAlias)) {
                 // Alias already exists on this ingredient, return the ingredient as is.
                 return res.status(200).json(ingredient);
             }
             // If ingredient exists but update failed for other reasons (shouldn't happen with current logic)
             return res.status(500).json({ message: 'Failed to add alias for an unknown reason.' });
        }

        res.status(200).json(updatedIngredient);
    } catch (error: unknown) {
        console.error('Error adding alias to ingredient:', error);
        if (error instanceof Error && error.message.startsWith('Alias') && error.message.includes('already associated with')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error while adding alias.' });
    }
};

export const addStockToIngredientHandler = async (req: Request, res: Response) => {
  try {
    const { ingredientId } = req.params;
    const { quantityToAdd } = req.body;

    if (!isValidObjectId(ingredientId)) {
      return res.status(400).json({ message: 'Invalid ingredient ID format.' });
    }

    if (typeof quantityToAdd !== 'number') {
      return res.status(400).json({ message: 'quantityToAdd is required and must be a number.' });
    }

    const updatedIngredient = await ingredientService.updateIngredientStock(ingredientId, quantityToAdd);

    if (!updatedIngredient) {
      // This could be because the ingredient was not found
      // Or potentially other issues like validation if strict rules were in place (e.g. stock cannot be negative)
      const ingredientExists = await ingredientService.getIngredientById(ingredientId);
      if (!ingredientExists) {
        return res.status(404).json({ message: `Ingredient with ID ${ingredientId} not found.` });
      }
      // If ingredient exists but update failed, it's an unexpected server error or validation issue
      return res.status(500).json({ message: 'Failed to update ingredient stock for an unknown reason.' });
    }

    res.status(200).json(updatedIngredient);
  } catch (error: unknown) {
    console.error(`Error in addStockToIngredientHandler for ID ${req.params.ingredientId}:`, error);
    if (error instanceof Error) {
      if (error.message.includes('Validation failed')) {
          return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('Failed to update ingredient stock')) {
          return res.status(500).json({ message: error.message });
      }
    }
    res.status(500).json({ message: 'Internal server error while updating ingredient stock.' });
  }
};
export const batchAddPurchaseHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'items array is required and must not be empty.' });
      return;
    }

    // Basic validation
    for (const [idx, item] of items.entries()) {
      if (!item.ingredientId && (!item.name || typeof item.name !== 'string' || item.name.trim() === '')) {
        res.status(400).json({
          message: `Item ${idx}: ingredientId or a valid name is required.`,
        });
        return;
      }
      if (typeof item.quantityToAdd !== 'number' || item.quantityToAdd <= 0) {
        res.status(400).json({
          message: `Item ${idx}: quantityToAdd must be a positive number.`,
        });
        return;
      }
    }

    const results = await ingredientService.batchAddPurchase(items);
    res.status(200).json({ ingredients: results, count: results.length });
  } catch (error) {
    console.error('Error in batch purchase:', error);
    res.status(500).json({ message: 'Failed to process batch purchase.' });
  }
};

export const resetAllIngredientStockHandler = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const count = await ingredientService.resetAllIngredientStock();
    res.status(200).json({
      message: 'All ingredient stock reset to 0.',
      modifiedCount: count,
    });
  } catch (error) {
    console.error('Error resetting all ingredient stock:', error);
    res.status(500).json({ message: 'Failed to reset ingredient stock.' });
  }
};

export const getIngredientDependencies = async (req: Request, res: Response) => {
  try {
    const { ingredientId } = req.params;

    if (!isValidObjectId(ingredientId)) {
      return res.status(400).json({ message: 'Invalid ingredient ID format.' });
    }

    const recipes = await ingredientService.getRecipesByIngredientId(ingredientId);
    // The service function returns an empty array if no recipes are found,
    // or if the ingredientId was invalid (after our initial check).
    // So, we can directly return the result.
    res.status(200).json(recipes);

  } catch (error: unknown) {
    console.error(`Error fetching ingredient dependencies for ID ${req.params.ingredientId}:`, error);
    res.status(500).json({ message: 'Internal server error while fetching ingredient dependencies.' });
  }
};