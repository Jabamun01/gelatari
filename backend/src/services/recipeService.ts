import Recipe, { IRecipe } from '../models/Recipe';
import { Types } from 'mongoose';

// Type for recipe creation data (excluding auto-generated fields)
type CreateRecipeData = Omit<IRecipe, '_id' | 'createdAt' | 'updatedAt'>;

// Type for recipe update data
type UpdateRecipeData = Partial<IRecipe>;

// Type for filtering options in getAllRecipes
export interface RecipeFilter {
  type?: 'ice cream recipe' | 'not ice cream recipe';
  searchTerm?: string;
}

/**
 * Creates a new recipe in the database.
 * @param recipeData - The data for the new recipe.
 * @returns The created recipe document.
 * @throws Throws an error if recipe creation fails.
 */
export const createRecipe = async (
  recipeData: CreateRecipeData,
): Promise<IRecipe> => {
  try {
    let dataToSave = { ...recipeData }; // Start with a copy of the input data

    // Check if scaling is needed
    if (dataToSave.baseYieldGrams && dataToSave.baseYieldGrams !== 1000) {
      const scalingFactor = 1000 / dataToSave.baseYieldGrams;

      // Scale ingredients
      if (dataToSave.ingredients) {
        dataToSave.ingredients = dataToSave.ingredients.map(ing => ({
          ...ing,
          amountGrams: Math.round(ing.amountGrams * scalingFactor), // Round to nearest gram
        }));
      }

      // Scale linked recipes
      if (dataToSave.linkedRecipes) {
        dataToSave.linkedRecipes = dataToSave.linkedRecipes.map(linked => ({
          ...linked,
          amountGrams: Math.round(linked.amountGrams * scalingFactor), // Round to nearest gram
        }));
      }

      // Set base yield to 1000
      dataToSave.baseYieldGrams = 1000;
    } else if (!dataToSave.baseYieldGrams) {
      // If baseYieldGrams is missing, assume 1000 (or handle as error if required)
      // For now, let's default it to 1000 if missing. Consider validation upstream.
      dataToSave.baseYieldGrams = 1000;
    }

    const newRecipeInstance = new Recipe(dataToSave); // Use potentially scaled data
    const savedRecipe = await newRecipeInstance.save(); // Save the instance
    // Populate the saved document before returning
    await savedRecipe.populate('ingredients.ingredient', 'name isAllergen');
    await savedRecipe.populate('linkedRecipes.recipe', 'name');
    return savedRecipe;
  } catch (error) {
    console.error('Error creating recipe:', error);
    // Re-throw the error to be handled by the controller
    throw new Error('Failed to create recipe');
  }
};

/**
 * Retrieves all recipes, optionally filtering by type and searching by name.
 * Populates ingredient and linked recipe details.
 * @param filter - Optional filter criteria (type, searchTerm).
 * @returns A promise resolving to an array of recipe documents.
 */
export const getAllRecipes = async (
  filter: RecipeFilter = {},
): Promise<IRecipe[]> => {
  try {
    const query: any = {};

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.searchTerm) {
      // Case-insensitive search on the name field
      query.name = { $regex: filter.searchTerm, $options: 'i' };
    }

    const recipes = await Recipe.find(query)
      .populate('ingredients.ingredient', 'name isAllergen') // Populate ingredient details
      .populate('linkedRecipes.recipe', 'name') // Populate linked recipe names
      .sort({ name: 1 }) // Optional: sort by name
      .exec();
    return recipes;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return []; // Return empty array on error
  }
};

/**
 * Retrieves a single recipe by its ID, populating related data.
 * @param id - The ID of the recipe to retrieve.
 * @returns A promise resolving to the recipe document or null if not found or invalid ID.
 */
export const getRecipeById = async (id: string): Promise<IRecipe | null> => {
  try {
    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      console.warn(`Invalid recipe ID format: ${id}`);
      return null;
    }

    const recipe = await Recipe.findById(id)
      .populate('ingredients.ingredient', 'name isAllergen') // Populate ingredient details
      .populate('linkedRecipes.recipe', 'name') // Populate linked recipe names
      .exec();

    if (!recipe) {
      console.warn(`Recipe not found with ID: ${id}`);
      return null;
    }

    return recipe;
  } catch (error) {
    console.error(`Error fetching recipe with ID ${id}:`, error);
    return null; // Return null on error
  }
};

/**
 * Updates an existing recipe by its ID.
 * @param id - The ID of the recipe to update.
 * @param updates - An object containing the fields to update.
 * @returns A promise resolving to the updated recipe document or null if not found.
 */
export const updateRecipe = async (
  id: string,
  updates: UpdateRecipeData,
): Promise<IRecipe | null> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
        console.warn(`Invalid recipe ID format for update: ${id}`);
        return null;
    }

    // Find and update the recipe, return the *new* document after update
    const updatedRecipe = await Recipe.findByIdAndUpdate(id, updates, {
      new: true, // Return the modified document rather than the original
      runValidators: true, // Ensure updates adhere to schema validation
    })
      .populate('ingredients.ingredient', 'name isAllergen')
      .populate('linkedRecipes.recipe', 'name')
      .exec();

    if (!updatedRecipe) {
      console.warn(`Recipe not found for update with ID: ${id}`);
      return null;
    }

    return updatedRecipe;
  } catch (error) {
    console.error(`Error updating recipe with ID ${id}:`, error);
    // Check for specific validation errors if needed, otherwise return null
    return null;
  }
};

/**
 * Deletes a recipe by its ID.
 * @param id - The ID of the recipe to delete.
 * @returns A promise resolving to the deleted recipe document or null if not found.
 */
export const deleteRecipe = async (id: string): Promise<IRecipe | null> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
        console.warn(`Invalid recipe ID format for delete: ${id}`);
        return null;
    }

    const deletedRecipe = await Recipe.findByIdAndDelete(id).exec();

    if (!deletedRecipe) {
      console.warn(`Recipe not found for deletion with ID: ${id}`);
      return null;
    }

    // Note: The deleted document is returned, but it won't have populated fields
    // If populated fields were needed *after* deletion, you'd fetch it first.
    return deletedRecipe;
  } catch (error) {
    console.error(`Error deleting recipe with ID ${id}:`, error);
    return null; // Return null on error
  }
};