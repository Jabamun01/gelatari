import Recipe, { IRecipe, IRecipeIngredient } from '../models/Recipe';
import { Types } from 'mongoose';
import { updateIngredientStock } from './ingredientService'; // Added import
// import { IIngredient } from '../models/Ingredient'; // Removed unused import

// Type for recipe creation data (excluding auto-generated fields)
type CreateRecipeData = Omit<IRecipe, '_id' | 'createdAt' | 'updatedAt'>;

// Type for recipe update data
type UpdateRecipeData = Partial<IRecipe>;

// Type for filtering options in getAllRecipes
export interface RecipeFilter {
  type?: 'ice cream recipe' | 'not ice cream recipe';
  searchTerm?: string;
}

// Type for the result of deleteRecipe when dependencies are found
export interface RecipeDeletionDependencies {
  dependencies: Array<{
    _id: Types.ObjectId;
    name: string;
  }>;
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

    // START: Autoscaling logic for edited recipes
    // Ensure ingredients and linkedRecipes are at least empty arrays for processing
    // to prevent errors if they are null or undefined on the updatedRecipe object.
    const ingredients = updatedRecipe.ingredients || [];
    const linkedRecipes = updatedRecipe.linkedRecipes || [];

    // Calculate current total yield from the (potentially updated) ingredients and linked recipes
    // Defaulting amountGrams to 0 if it's somehow missing, though schema should prevent this.
    const currentTotalYield =
      ingredients.reduce((sum, ing) => sum + (ing.amountGrams || 0), 0) +
      linkedRecipes.reduce((sum, linked) => sum + (linked.amountGrams || 0), 0);

    let recipeWasModified = false;

    // Only scale if there's something to scale (currentTotalYield > 0) and the yield isn't already 1000g
    if (currentTotalYield > 0 && currentTotalYield !== 1000) {
      const scalingFactor = 1000 / currentTotalYield;

      ingredients.forEach(ing => {
        ing.amountGrams = Math.round((ing.amountGrams || 0) * scalingFactor);
      });

      linkedRecipes.forEach(linked => {
        linked.amountGrams = Math.round((linked.amountGrams || 0) * scalingFactor);
      });

      updatedRecipe.baseYieldGrams = 1000;
      recipeWasModified = true;
    } else if (updatedRecipe.baseYieldGrams !== 1000) {
      // This condition handles cases where:
      // 1. currentTotalYield is 0 (no ingredients/linked recipes, or all amounts are 0).
      // 2. currentTotalYield is already 1000g.
      // In these situations, if baseYieldGrams is not 1000, it's corrected.
      updatedRecipe.baseYieldGrams = 1000;
      recipeWasModified = true;
    }

    if (recipeWasModified) {
      // Save the recipe with scaled ingredients/yield or corrected baseYieldGrams
      const finalRecipe = await updatedRecipe.save();
      // Re-populate because .save() might return a document that isn't populated,
      // or the populated fields on the instance might need refreshing to reflect any changes.
      await finalRecipe.populate([
        { path: 'ingredients.ingredient', select: 'name isAllergen' },
        { path: 'linkedRecipes.recipe', select: 'name' }
      ]);
      return finalRecipe;
    }

    // If no scaling or baseYieldGrams adjustment was needed,
    // the `updatedRecipe` from `findByIdAndUpdate` is already populated and correct.
    return updatedRecipe;
    // END: Autoscaling logic
  } catch (error) {
    console.error(`Error updating recipe with ID ${id}:`, error);
    // Check for specific validation errors if needed, otherwise return null
    return null;
  }
};

/**
 * Deletes a recipe by its ID.
 * If the recipe is a dependency for other recipes, it returns information about these dependencies.
 * Otherwise, it deletes the recipe.
 * @param id - The ID of the recipe to delete.
 * @returns A promise resolving to the deleted recipe document, null if not found or invalid ID,
 * or a RecipeDeletionDependencies object if dependencies exist.
 */
export const deleteRecipe = async (
  id: string,
): Promise<IRecipe | null | RecipeDeletionDependencies> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      console.warn(`Invalid recipe ID format for delete: ${id}`);
      return null;
    }

    // Check if this recipe is a linkedRecipe in any other recipes
    const dependentRecipes = await Recipe.find({
      'linkedRecipes.recipe': new Types.ObjectId(id),
    })
      .select('_id name') // Select only the ID and name of dependent recipes
      .lean() // Use lean for performance as we don't need Mongoose documents here
      .exec();

    if (dependentRecipes.length > 0) {
      console.warn(
        `Recipe with ID ${id} is a dependency for other recipes:`,
        dependentRecipes.map(r => r.name),
      );
      return {
        dependencies: dependentRecipes.map(r => ({
          _id: new Types.ObjectId(r._id.toString()), // Convert to mongoose.Types.ObjectId
          name: r.name,
        })),
      };
    }

    // If no dependencies, proceed with deletion
    const deletedRecipe = await Recipe.findByIdAndDelete(id).exec();

    if (!deletedRecipe) {
      console.warn(`Recipe not found for deletion with ID: ${id}`);
      return null;
    }

    // Note: The deleted document is returned.
    return deletedRecipe;
  } catch (error) {
    console.error(`Error deleting recipe with ID ${id}:`, error);
    // Consider re-throwing a more specific error or handling it based on error type
    throw new Error(`Failed to delete recipe with ID ${id}`);
  }
};

/**
 * Finalizes the production of a recipe, deducting ingredient stock.
 * @param recipeId - The ID of the recipe to finalize.
 * @returns The recipe document, possibly with an updated status.
 * @throws Throws an error if the recipe is not found or if a critical error occurs during stock update.
 */
export const finalizeRecipeProduction = async (
  recipeId: string,
): Promise<IRecipe | null> => {
  try {
    const recipe = await getRecipeById(recipeId);

    if (!recipe) {
      console.error(`Recipe not found with ID: ${recipeId} for finalization.`);
      throw new Error(`Recipe not found with ID: ${recipeId}`);
    }

    if (recipe.ingredients && recipe.ingredients.length > 0) {
      for (const recipeIngredient of recipe.ingredients) {
        // Ensure recipeIngredient.ingredient is populated and has an _id
        if (
          !recipeIngredient.ingredient ||
          typeof recipeIngredient.ingredient === 'string' || // if not populated, it's an ObjectId string
          !recipeIngredient.ingredient._id
        ) {
          console.warn(
            `Ingredient details missing for an ingredient in recipe ${recipeId}. Skipping stock update for this item.`,
          );
          continue;
        }

        const ingredientId = recipeIngredient.ingredient._id.toString();
        const changeInQuantity = -recipeIngredient.amountGrams;

        try {
          const updatedIngredient = await updateIngredientStock(
            ingredientId,
            changeInQuantity,
          );

          if (!updatedIngredient) {
            console.warn(
              `Ingredient with ID ${ingredientId} not found during stock update for recipe ${recipeId}. Stock not deducted.`,
            );
            // Decide if this should be a critical error or just a warning
          } else {
            console.log(
              `Stock for ingredient ${updatedIngredient.name} (ID: ${ingredientId}) updated by ${changeInQuantity}. New stock: ${updatedIngredient.quantityInStock}`,
            );
            if (updatedIngredient.quantityInStock < 0) {
              console.warn(
                `Stock for ingredient ${updatedIngredient.name} (ID: ${ingredientId}) is now negative: ${updatedIngredient.quantityInStock}.`,
              );
            }
          }
        } catch (stockUpdateError) {
          console.error(
            `Failed to update stock for ingredient ID ${ingredientId} in recipe ${recipeId}:`,
            stockUpdateError,
          );
          // Depending on requirements, you might want to re-throw or collect errors
          // For now, log and continue to attempt to update other ingredients
        }
      }
    } else {
      console.log(
        `Recipe ${recipeId} has no ingredients to deduct stock from.`,
      );
    }

    // TODO: Update recipe status if applicable (e.g., recipe.status = 'PRODUCTION_FINALIZED')
    // const updatedRecipe = await updateRecipe(recipeId, { status: 'FINALIZED' });
    // For now, return the original recipe fetched, as status update is secondary
    // If a status update is implemented and returns the updated recipe, return that instead.

    // Re-fetch the recipe to ensure all populated fields are fresh if no direct status update is made here
    // or if the recipe object itself needs to reflect some change not covered by ingredient updates.
    // However, getRecipeById already populates. If no direct changes to the recipe doc itself, this might be redundant.
    return getRecipeById(recipeId); // Return the recipe, potentially for the controller to send back
  } catch (error) {
    console.error(`Error finalizing recipe production for ID ${recipeId}:`, error);
    // Re-throw the error to be handled by the controller
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to finalize recipe production.');
  }
};

/**
 * Retrieves all "parent" recipes that use the given recipeId as a linked recipe.
 * @param recipeId - The ID of the recipe to check for dependencies.
 * @returns A promise resolving to an array of parent recipe documents.
 * @throws Throws an error if the query fails.
 */
export const getDependentParentRecipes = async (recipeId: string): Promise<IRecipe[]> => {
  try {
    if (!Types.ObjectId.isValid(recipeId)) {
      console.warn(`Invalid recipe ID format for dependency check: ${recipeId}`);
      return []; // Or throw an error, returning empty array for now
    }

    const parentRecipes = await Recipe.find({
      'linkedRecipes.recipe': new Types.ObjectId(recipeId),
    })
      .select('_id name type category') // Select relevant fields for the frontend
      .lean() // Use lean for performance if full Mongoose documents aren't needed by caller
      .exec();

    return parentRecipes as IRecipe[]; // Cast if lean() is used and IRecipe is expected
  } catch (error) {
    console.error(`Error fetching dependent parent recipes for recipe ID ${recipeId}:`, error);
    throw new Error(`Failed to fetch dependent parent recipes for recipe ID ${recipeId}`);
  }
};