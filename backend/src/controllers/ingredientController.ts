import { Request, Response } from 'express';
import * as ingredientService from '../services/ingredientService';
import Ingredient from '../models/Ingredient'; // Import the model for checking duplicates
import { Types } from 'mongoose'; // Needed for ObjectId validation

// Basic validation helper
const isValidObjectId = (id: string): boolean => Types.ObjectId.isValid(id);

export const createIngredientHandler = async (req: Request, res: Response) => {
  try {
    const { name, aliases } = req.body;

    // Basic input validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Ingredient name is required and must be a non-empty string.' });
    }
    if (aliases !== undefined && (!Array.isArray(aliases) || !aliases.every(a => typeof a === 'string' && a.trim() !== ''))) {
        return res.status(400).json({ message: 'Aliases must be an array of non-empty strings if provided.' });
    }

    const trimmedName = name.trim();
    const finalAliases = aliases ? aliases.map((a: string) => a.trim()).filter((a: string) => a) : []; // Trim and filter empty aliases

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
    };

    // The conflict check above already handles duplicates based on name and aliases.
    // We keep the service call which has its own final check.

    // Proceed to create
    const newIngredient = await ingredientService.createIngredient(
        ingredientData.name,
        ingredientData.aliases
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

export const updateIngredientHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

     if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid ingredient ID format.' });
    }

    // Basic validation for updates
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Update data is required and cannot be empty.' });
    }
    // Optional: Add more specific validation for allowed update fields (e.g., name, isAllergen)
    if (updates.name !== undefined && (typeof updates.name !== 'string' || updates.name.trim() === '')) {
        return res.status(400).json({ message: 'Ingredient name must be a non-empty string if provided for update.' });
    }
    // Filter updates to only include allowed fields if necessary
    const allowedUpdates: { name?: string } = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name.trim();


    const updatedIngredient = await ingredientService.updateIngredient(id, allowedUpdates);
    if (!updatedIngredient) {
      return res.status(404).json({ message: 'Ingredient not found for update.' });
    }
    res.status(200).json(updatedIngredient);
  } catch (error: any) {
     // Handle potential duplicate key error from MongoDB (code 11000) during update
    if (error.code === 11000) {
        return res.status(400).json({ message: `An ingredient with the name "${req.body.name}" already exists.` });
    }
    console.error('Error updating ingredient:', error);
    res.status(500).json({ message: 'Internal server error while updating ingredient.' });
  }
};

export const deleteIngredientHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid ingredient ID format.' });
    }

    const deletedIngredient = await ingredientService.deleteIngredient(id);
    if (!deletedIngredient) {
      return res.status(404).json({ message: 'Ingredient not found for deletion.' });
    }
    // Send back the deleted ingredient object or just a success message
    // res.status(200).json(deletedIngredient);
    res.status(200).json({ message: 'Ingredient deleted successfully.', ingredient: deletedIngredient });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({ message: 'Internal server error while deleting ingredient.' });
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