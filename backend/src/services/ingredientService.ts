import Ingredient, { IIngredient } from '../models/Ingredient';
import mongoose from 'mongoose';

/**
 * Creates a new ingredient in the database.
 * @param name - The name of the ingredient.
 * @param isAllergen - Whether the ingredient is an allergen.
 * @returns The created ingredient document.
 * @throws Error if creation fails (e.g., duplicate name).
 */
export const createIngredient = async (name: string, isAllergen: boolean): Promise<IIngredient> => {
  try {
    const newIngredient = new Ingredient({ name, isAllergen });
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
 * Retrieves ingredients from the database with pagination, optionally filtering by name (case-insensitive).
 * @param name - Optional name to filter by.
 * @param page - The page number to retrieve (1-based).
 * @param limit - The number of items per page.
 * @returns An object containing the paginated ingredients and pagination metadata.
 * @throws Error if retrieval fails.
 */
export const getAllIngredients = async (
    name?: string,
    page: number = 1,
    limit: number = 10
): Promise<{ ingredients: IIngredient[]; totalCount: number; totalPages: number }> => {
  try {
    // Construct the filter object based on whether 'name' is provided
    const filter = name
      ? { name: { $regex: name, $options: 'i' } } // Use name directly for partial match (case-insensitive)
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
 * @param updates - An object containing the fields to update (name, isAllergen).
 * @returns The updated ingredient document or null if not found or ID is invalid.
 */
export const updateIngredient = async (
  id: string,
  updates: { name?: string; isAllergen?: boolean }
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