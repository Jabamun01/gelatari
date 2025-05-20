import { Request, Response } from 'express';
import * as ingredientService from '../services/ingredientService';
import Ingredient from '../models/Ingredient'; // Import the model for checking duplicates
import { Types } from 'mongoose'; // Needed for ObjectId validation

// Basic validation helper
const isValidObjectId = (id: string): boolean => Types.ObjectId.isValid(id);

export const createIngredientHandler = async (req: Request, res: Response) => {
  try {
    const { name, aliases, quantityInStock } = req.body;

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

    const trimmedName = name.trim();
    const finalAliases = aliases ? aliases.map((a: string) => a.trim()).filter((a: string) => a) : []; // Trim and filter empty aliases
    const finalQuantityInStock = quantityInStock !== undefined ? Number(quantityInStock) : undefined;

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
    };

    // The conflict check above already handles duplicates based on name and aliases.
    // We keep the service call which has its own final check.

    // Proceed to create
    const newIngredient = await ingredientService.createIngredient(
        ingredientData.name,
        ingredientData.aliases,
        ingredientData.quantityInStock
    );
    res.status(201).json(newIngredient);
  } catch (error: any) {
    console.error('Caught error during ingredient creation:', error); // Log the full error
    // Handle potential duplicate key error from MongoDB (code 11000) as a fallback, return 409
    if (error && error.code === 11000) { // Add null check for error
        // This might still happen in rare race conditions
        return res.status(409).json({ message: `Ingredient creation failed due to a conflict (e.g., name or alias already exists).` });
    }
    console.error('Error creating ingredient (unhandled):', error); // Log if not duplicate
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
  } catch (error) {
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
  } catch (error) {
    console.error('Error fetching ingredient by ID:', error);
    res.status(500).json({ message: 'Internal server error while fetching ingredient by ID.' });
  }
};

export const updateIngredientHandler = async (req: Request, res: Response, next: Function) => {
  try {
    const { id } = req.params;
    const { name, aliases, quantityInStock } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ingredient ID format.' });
    }

    // --- Input Validation ---
    const updateData: { name?: string; aliases?: string[]; quantityInStock?: number } = {};
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
      // Allow empty strings in aliases array as per some use cases, or trim and filter:
      // updateData.aliases = aliases.map(a => a.trim()).filter(a => a);
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

    if (!hasValidUpdateField && Object.keys(req.body).length > 0) {
        // If body is not empty but no valid fields were extracted (e.g. only extraneous fields sent)
        return res.status(400).json({ message: 'No valid fields provided for update. Allowed fields are: name, aliases, quantityInStock.' });
    }
    // If req.body is empty, service layer will handle it by returning current ingredient.

    // --- Service Call ---
    const updatedIngredient = await ingredientService.updateIngredientById(id, updateData);

    if (!updatedIngredient) {
      return res.status(404).json({ message: 'Ingredient not found.' });
    }

    res.status(200).json(updatedIngredient);

  } catch (error: any) {
    console.error(`Error in updateIngredientHandler for ID ${req.params.id}:`, error);

    // Specific error handling based on service layer exceptions
    if (error.message.includes('already exists')) { // From duplicate name check
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    if (error.message.startsWith('Validation failed')) { // From Mongoose validation
      return res.status(400).json({ message: error.message });
    }
    
    // Pass to generic error handler
    // For other errors, or if you want a centralized error handling middleware:
    // next(error);
    // For now, returning a generic 500 for unhandled cases here:
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
  } catch (error: any) {
    console.error('Error deleting ingredient:', error.message);
    // Handle specific operational errors thrown by the service
    if (error.isOperational) {
      if (error.statusCode === 409) { // Conflict - ingredient in use
        return res.status(409).json({
          message: error.message,
          details: error.details, // Contains the list of recipes
        });
      }
      if (error.statusCode === 404) { // Not Found
        return res.status(404).json({ message: error.message });
      }
      // Handle other operational errors if any are defined
    }
    // Handle invalid ID format error (if service throws it with a specific message/code)
    if (error.message.startsWith('Invalid ingredient ID format')) {
        return res.status(400).json({ message: error.message });
    }
    // Generic server error for unhandled cases
    res.status(500).json({ message: error.message || 'Internal server error while deleting ingredient.' });
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
    } catch (error: any) {
        console.error('Error adding alias to ingredient:', error);
        // Handle specific error from service (alias conflict with another ingredient)
        if (error.message.startsWith('Alias') && error.message.includes('already associated with')) {
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
  } catch (error: any) {
    console.error(`Error in addStockToIngredientHandler for ID ${req.params.ingredientId}:`, error);
    if (error.message.includes('Validation failed')) {
        return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Failed to update ingredient stock')) { // Generic from service
        return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error while updating ingredient stock.' });
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

  } catch (error: any) {
    console.error(`Error fetching ingredient dependencies for ID ${req.params.ingredientId}:`, error);
    // Handle specific errors if the service layer were to throw them differently,
    // but for now, a generic 500 is appropriate for unexpected service errors.
    res.status(500).json({ message: 'Internal server error while fetching ingredient dependencies.' });
  }
};