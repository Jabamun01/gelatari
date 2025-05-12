import Ingredient, { IIngredient } from '../models/Ingredient';
import mongoose from 'mongoose';

/**
 * Creates a new ingredient in the database.
 * @param name - The name of the ingredient.
 * @param aliases - Optional array of aliases for the ingredient.
 * @returns The created ingredient document.
 * @throws Error if creation fails (e.g., duplicate name).
 */
export const createIngredient = async (
  name: string,
  aliases?: string[]
): Promise<IIngredient> => {
  try {
    const newIngredient = new Ingredient({ name, aliases: aliases || [] });
    await newIngredient.save();
    return newIngredient;
  } catch (error: any) {
    console.error('Error creating ingredient:', error);
    // Handle specific errors like duplicate key
    if (error.code === 11000) {
      throw error; // Re-throw the original MongoDB error
    }
    throw new Error('Failed to create ingredient.');
  }
};

/**
 * Retrieves ingredients from the database with pagination, optionally filtering by name or alias (case-insensitive).
 * @param searchTerm - Optional term to filter by (matches name or alias).
 * @param page - The page number to retrieve (1-based).
 * @param limit - The number of items per page.
 * @returns An object containing the paginated ingredients and pagination metadata.
 * @throws Error if retrieval fails.
 */
export const getAllIngredients = async (
    searchTerm?: string,
    page: number = 1,
    limit: number = 10
): Promise<{ ingredients: IIngredient[]; totalCount: number; totalPages: number }> => {
  try {
    // Construct the filter object based on whether 'name' is provided
    // Construct the filter object based on whether 'searchTerm' is provided
    const filter = searchTerm
      ? {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } }, // Match name (case-insensitive)
            { aliases: { $regex: searchTerm, $options: 'i' } }, // Match aliases (case-insensitive)
          ],
        }
      : {}; // Empty filter means find all

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Get the total count of documents matching the filter
    const totalCount = await Ingredient.countDocuments(filter);

    // Fetch the paginated ingredients
    const ingredients = await Ingredient.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 }); // Optional: sort by name

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalCount / limit);

    return {
      ingredients,
      totalCount,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching ingredients with pagination:', error);
    throw new Error('Failed to fetch ingredients.');
  }
};

/**
 * Retrieves a single ingredient by its ID.
 * @param id - The ID of the ingredient to retrieve.
 * @returns The ingredient document or null if not found or ID is invalid.
 */
export const getIngredientById = async (id: string): Promise<IIngredient | null> => {
  // Validate if the provided ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`Invalid ingredient ID format: ${id}`);
      return null;
  }
  try {
    const ingredient = await Ingredient.findById(id);
    return ingredient; // Returns null if not found by findById
  } catch (error) {
    console.error(`Error fetching ingredient by ID ${id}:`, error);
    // In case of CastError or other unexpected errors during findById
    return null;
  }
};

/**
 * Updates an existing ingredient by its ID.
 * @param id - The ID of the ingredient to update.
 * @param updates - An object containing the fields to update (name).
 * @returns The updated ingredient document or null if not found or ID is invalid.
 */
export const updateIngredient = async (
  id: string,
  updates: { name?: string }
): Promise<IIngredient | null> => {
   if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`Invalid ingredient ID format for update: ${id}`);
      return null;
  }
  try {
    // { new: true } returns the modified document rather than the original
    const updatedIngredient = await Ingredient.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return updatedIngredient; // Returns null if ID not found
  } catch (error: any) {
    console.error(`Error updating ingredient by ID ${id}:`, error);
     // Handle specific errors like duplicate key if name is updated
    if (error.code === 11000 && updates.name) {
      throw new Error(`Ingredient with name "${updates.name}" already exists.`);
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
        throw new Error(`Validation failed: ${error.message}`);
    }
    return null; // Return null for other errors or if not found
  }
};

/**
 * Deletes an ingredient by its ID.
 * @param id - The ID of the ingredient to delete.
 * @returns The deleted ingredient document or null if not found or ID is invalid.
 */
export const deleteIngredient = async (id: string): Promise<IIngredient | null> => {
   if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`Invalid ingredient ID format for delete: ${id}`);
      return null;
  }
  try {
    const deletedIngredient = await Ingredient.findByIdAndDelete(id);
    return deletedIngredient; // Returns null if ID not found
  } catch (error) {
    console.error(`Error deleting ingredient by ID ${id}:`, error);
    return null; // Return null in case of error
  }
};

/**
 * Adds an alias to an existing ingredient.
 * @param id - The ID of the ingredient to update.
 * @param alias - The alias string to add.
 * @returns The updated ingredient document or null if not found, ID is invalid, or alias already exists.
 * @throws Error if the alias already exists on another ingredient.
 */
export const addAliasToIngredient = async (id: string, alias: string): Promise<IIngredient | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.warn(`Invalid ingredient ID format for adding alias: ${id}`);
    return null;
  }

  try {
    // 1. Check if the alias already exists on *another* ingredient (name or alias)
    const existingIngredientWithAlias = await Ingredient.findOne({
      _id: { $ne: id }, // Exclude the current ingredient
      $or: [
        { name: { $regex: `^${alias}$`, $options: 'i' } }, // Exact match name (case-insensitive)
        { aliases: { $regex: `^${alias}$`, $options: 'i' } } // Exact match alias (case-insensitive)
      ]
    });

    if (existingIngredientWithAlias) {
      throw new Error(`Alias "${alias}" is already associated with ingredient "${existingIngredientWithAlias.name}".`);
    }

    // 2. Add the alias to the target ingredient if it doesn't already exist there
    const updatedIngredient = await Ingredient.findOneAndUpdate(
      {
        _id: id,
        // Ensure the alias (case-insensitive) doesn't already exist in the name or aliases array
        name: { $not: { $regex: `^${alias}$`, $options: 'i' } },
        aliases: { $not: { $regex: `^${alias}$`, $options: 'i' } }
      },
      { $addToSet: { aliases: alias } }, // Use $addToSet to avoid duplicates within the same ingredient
      { new: true } // Return the updated document
    );

    if (!updatedIngredient) {
        // This could happen if the ingredient wasn't found OR if the alias already exists on this ingredient
        const ingredient = await Ingredient.findById(id);
        if (ingredient) {
            // Check if the alias matches the name or an existing alias (case-insensitive)
            const lowerCaseAlias = alias.toLowerCase();
            if (ingredient.name.toLowerCase() === lowerCaseAlias || ingredient.aliases.some(a => a.toLowerCase() === lowerCaseAlias)) {
                console.warn(`Alias "${alias}" already exists for ingredient "${ingredient.name}" (ID: ${id}).`);
                // Optionally, return the ingredient as it is, since the alias effectively exists
                 return ingredient;
            }
        }
        console.warn(`Ingredient not found or alias "${alias}" could not be added (ID: ${id}).`);
        return null; // Ingredient not found or alias already present (handled by query conditions)
    }

    return updatedIngredient;
  } catch (error: any) {
    console.error(`Error adding alias "${alias}" to ingredient ID ${id}:`, error);
    // Re-throw specific errors like the one we created
    if (error.message.startsWith('Alias')) {
        throw error;
    }
    return null; // Return null for other errors
  }
};