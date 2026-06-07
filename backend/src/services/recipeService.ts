import Recipe, { IRecipe, IRecipeIngredient } from '../models/Recipe';
import Ingredient from '../models/Ingredient';
import { Types } from 'mongoose';
import { updateIngredientStock } from './ingredientService';
import IceCreamFlavor from '../models/IceCreamFlavor';
import * as iceCreamEventService from './iceCreamEventService';

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
 * Auto-create the base IceCreamFlavor for an ice cream recipe (no mix-ins).
 * Sets recipe.baseFlavorId and saves the recipe.
 */
async function autoCreateFlavorForRecipe(recipe: IRecipe): Promise<void> {
  if (recipe.type !== 'ice cream recipe') return;

  const newFlavor = new IceCreamFlavor({
    name: recipe.name,
    sourceRecipeId: recipe._id,
    mixIns: [],
  });
  const savedFlavor = await newFlavor.save();

  recipe.baseFlavorId = savedFlavor._id as Types.ObjectId;
  await recipe.save();
}

/**
 * Creates a new recipe in the database.
 * If the recipe is of type 'ice cream recipe', auto-creates a matching IceCreamFlavor.
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
          amountGrams: ing.amountGrams * scalingFactor, // Retain precision
        }));
      }

      // Scale linked recipes
      if (dataToSave.linkedRecipes) {
        dataToSave.linkedRecipes = dataToSave.linkedRecipes.map(linked => ({
          ...linked,
          amountGrams: linked.amountGrams * scalingFactor, // Retain precision
        }));
      }

      // Set base yield to 1000
      dataToSave.baseYieldGrams = 1000;
    } else if (!dataToSave.baseYieldGrams) {
      // If baseYieldGrams is missing, assume 1000 (or handle as error if required)
      dataToSave.baseYieldGrams = 1000;
    }

    const newRecipeInstance = new Recipe(dataToSave); // Use potentially scaled data
    const savedRecipe = await newRecipeInstance.save(); // Save the instance

    // Auto-create flavor for ice cream recipes
    if (savedRecipe.type === 'ice cream recipe') {
      await autoCreateFlavorForRecipe(savedRecipe);
    }

    // Populate the saved document before returning
    await savedRecipe.populate('ingredients.ingredient', 'name isAllergen mermaPercent');
    await savedRecipe.populate('linkedRecipes.recipe', 'name mermaPercent');
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
  page: number = 1,
  limit: number = 0, // 0 means no pagination (return all)
): Promise<{ recipes: IRecipe[]; totalCount: number; totalPages: number }> => {
  try {
    const query: any = {};

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.searchTerm) {
      // Case-insensitive search on the name field
      query.name = { $regex: filter.searchTerm, $options: 'i' };
    }

    // Get total count for pagination metadata
    const totalCount = await Recipe.countDocuments(query);

    let recipesQuery = Recipe.find(query)
      .populate('ingredients.ingredient', 'name isAllergen mermaPercent')
      .populate('linkedRecipes.recipe', 'name')
      .sort({ name: 1 });

    // Apply pagination only if limit > 0
    if (limit > 0) {
      const skip = (page - 1) * limit;
      recipesQuery = recipesQuery.skip(skip).limit(limit);
    }

    const recipes = await recipesQuery.exec();
    const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 1;

    return { recipes, totalCount, totalPages };
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return { recipes: [], totalCount: 0, totalPages: 1 };
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
      .populate('ingredients.ingredient', 'name isAllergen mermaPercent') // Populate ingredient details
      .populate('linkedRecipes.recipe', 'name mermaPercent') // Populate linked recipe names
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
 * Handles flavor sync: name changes, type changes, auto-creation, deletion.
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

    // Fetch the current recipe before applying updates
    const currentRecipe = await Recipe.findById(id).exec();
    if (!currentRecipe) {
      console.warn(`Recipe not found for update with ID: ${id}`);
      return null;
    }

    // --- Flavor sync logic ---
    const isBecomingIceCream = updates.type === 'ice cream recipe' && currentRecipe.type !== 'ice cream recipe';
    const isLeavingIceCream = updates.type && updates.type !== 'ice cream recipe' && currentRecipe.type === 'ice cream recipe';
    const nameChanged = updates.name && updates.name !== currentRecipe.name;

    // If type changed to ice cream recipe and no baseFlavorId yet, auto-create
    if (isBecomingIceCream && !currentRecipe.baseFlavorId) {
      // Apply the type update first so autoCreateFlavorForRecipe sees the right type
      currentRecipe.set(updates);
      await autoCreateFlavorForRecipe(currentRecipe);
      // Re-fetch to get the saved document with baseFlavorId
      const refreshed = await Recipe.findById(id)
        .populate('ingredients.ingredient', 'name isAllergen mermaPercent')
        .populate('linkedRecipes.recipe', 'name')
        .exec();
      return refreshed;
    }

    // If type changed away from ice cream recipe, delete ALL flavors linked to this recipe
    if (isLeavingIceCream && currentRecipe.baseFlavorId) {
      await IceCreamFlavor.deleteMany({ sourceRecipeId: new Types.ObjectId(id) });
      // Remove the baseFlavorId reference from updates so it's not preserved
      delete (updates as any).baseFlavorId;
    }

    // Find and update the recipe, return the *new* document after update
    const updatedRecipe = await Recipe.findByIdAndUpdate(id, updates, {
      new: true, // Return the modified document rather than the original
      runValidators: true, // Ensure updates adhere to schema validation
    })
      .populate('ingredients.ingredient', 'name isAllergen mermaPercent')
      .populate('linkedRecipes.recipe', 'name')
      .exec();

    if (!updatedRecipe) {
      console.warn(`Recipe not found for update with ID: ${id}`);
      return null;
    }

    // If the recipe name changed and it has a baseFlavorId, sync the BASE flavor name
    // (variant flavors keep their own names)
    if (nameChanged && updatedRecipe.baseFlavorId) {
      await IceCreamFlavor.findByIdAndUpdate(
        updatedRecipe.baseFlavorId,
        { $set: { name: updatedRecipe.name } },
      );
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
        ing.amountGrams = (ing.amountGrams || 0) * scalingFactor; // Retain precision
      });

      linkedRecipes.forEach(linked => {
        linked.amountGrams = (linked.amountGrams || 0) * scalingFactor; // Retain precision
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
 * Otherwise, it deletes the recipe and cascades to delete the linked flavor.
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

    // Cascade delete ALL flavors linked to this recipe
    const deleteResult = await IceCreamFlavor.deleteMany({ sourceRecipeId: new Types.ObjectId(id) });
    if (deleteResult.deletedCount > 0) {
      console.log(`Deleted ${deleteResult.deletedCount} linked flavor(s) for recipe ${id}`);
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
 * For ice cream recipes, automatically increments the linked flavor's mix stock.
 * @param recipeId - The ID of the recipe to finalize.
 * @returns The recipe document.
 * @throws Throws an error if the recipe is not found or if a critical error occurs.
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

    // --- Step 1: Deduct direct ingredient stock (applying each ingredient's own merma) ---
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      for (const recipeIngredient of recipe.ingredients) {
        if (
          !recipeIngredient.ingredient ||
          typeof recipeIngredient.ingredient === 'string' ||
          !recipeIngredient.ingredient._id
        ) {
          console.warn(
            `Ingredient details missing for an ingredient in recipe ${recipeId}. Skipping stock update for this item.`,
          );
          continue;
        }

        const ingredientId = recipeIngredient.ingredient._id.toString();

        // Fetch the ingredient to get its mermaPercent (handling loss for the raw material)
        let mermaMultiplier = 1;
        try {
          const fullIngredient = await Ingredient.findById(ingredientId).select('mermaPercent').lean();
          if (fullIngredient && fullIngredient.mermaPercent) {
            mermaMultiplier = 1 + fullIngredient.mermaPercent / 100;
          }
        } catch (fetchError) {
          console.warn(
            `Could not fetch mermaPercent for ingredient ID ${ingredientId}. Using default (no merma).`,
            fetchError,
          );
        }

        const adjustedAmount = recipeIngredient.amountGrams * mermaMultiplier;
        const changeInQuantity = -adjustedAmount;

        try {
          const updatedIngredient = await updateIngredientStock(
            ingredientId,
            changeInQuantity,
          );

          if (!updatedIngredient) {
            console.warn(
              `Ingredient with ID ${ingredientId} not found during stock update for recipe ${recipeId}. Stock not deducted.`,
            );
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
        }
      }
    } else {
      console.log(
        `Recipe ${recipeId} has no ingredients to deduct stock from.`,
      );
    }

    // --- Step 2: Deduct linked recipes (sub-recipes used as ingredients) from their product stock ---
    if (recipe.linkedRecipes && recipe.linkedRecipes.length > 0) {
      for (const linked of recipe.linkedRecipes) {
        if (
          !linked.recipe ||
          typeof linked.recipe === 'string' ||
          !linked.recipe._id
        ) {
          console.warn(
            `Linked recipe details missing for a linked recipe in ${recipeId}. Skipping stock deduction.`,
          );
          continue;
        }

        const linkedRecipeId = linked.recipe._id.toString();

        // Fetch the linked recipe to get its productIngredientId
        let linkedRecipeDoc: { productIngredientId?: any; name?: string } | null = null;
        try {
          linkedRecipeDoc = await Recipe.findById(linkedRecipeId).select('productIngredientId name').lean();
        } catch (fetchError) {
          console.warn(
            `Could not fetch linked recipe ${linkedRecipeId} for stock deduction. Skipping.`,
            fetchError,
          );
          continue;
        }

        if (!linkedRecipeDoc || !linkedRecipeDoc.productIngredientId) {
          console.warn(
            `Linked recipe "${linkedRecipeDoc?.name || linkedRecipeId}" has no product ingredient tracking. It may not have been finalized yet, or it may be an ice-cream recipe. Skipping stock deduction.`,
          );
          continue;
        }

        // Fetch the product Ingredient to get its mermaPercent
        const productIngId = linkedRecipeDoc.productIngredientId.toString();
        let productMermaMultiplier = 1;
        try {
          const productIng = await Ingredient.findById(productIngId).select('mermaPercent').lean();
          if (productIng && productIng.mermaPercent) {
            productMermaMultiplier = 1 + productIng.mermaPercent / 100;
          }
        } catch (fetchError) {
          console.warn(
            `Could not fetch product ingredient ${productIngId} for merma. Using default.`,
            fetchError,
          );
        }

        const deductionAmount = linked.amountGrams * productMermaMultiplier;

        try {
          const updatedProduct = await updateIngredientStock(
            productIngId,
            -deductionAmount,
          );

          if (!updatedProduct) {
            console.warn(
              `Product ingredient with ID ${productIngId} not found during linked-recipe stock deduction for recipe ${recipeId}.`,
            );
          } else {
            console.log(
              `Deducted ${deductionAmount.toFixed(3)}g of "${updatedProduct.name}" (linked recipe: ${linkedRecipeDoc.name}) for recipe ${recipeId}. New stock: ${updatedProduct.quantityInStock.toFixed(3)}g.`,
            );
            if (updatedProduct.quantityInStock < 0) {
              console.warn(
                `Stock for product "${updatedProduct.name}" is now negative: ${updatedProduct.quantityInStock.toFixed(3)}g.`,
              );
            }
          }
        } catch (stockUpdateError) {
          console.error(
            `Failed to deduct linked-recipe stock for product ID ${productIngId} in recipe ${recipeId}:`,
            stockUpdateError,
          );
        }
      }
    }

    // --- Step 3: If this is a non-ice-cream recipe, track its output as a product Ingredient ---
    if (recipe.type !== 'ice cream recipe') {
      // Apply production loss: what's lost to evaporation, sticking to equipment, etc.
      const productionLossMultiplier = 1 - (recipe.productionLossPercent || 0) / 100;
      const netYieldGrams = recipe.baseYieldGrams * productionLossMultiplier;

      if (netYieldGrams > 0) {
        try {
          // Determine the product Ingredient ID: use existing or find/create one
          let productIngId: string | null = recipe.productIngredientId
            ? recipe.productIngredientId.toString()
            : null;

          if (!productIngId) {
            // Look for an existing Ingredient with the same name
            const existingIng = await Ingredient.findOne({
              name: { $regex: `^${recipe.name}$`, $options: 'i' },
            }).select('_id').lean() as { _id: unknown } | null;

            if (existingIng) {
              productIngId = String(existingIng._id);
            } else {
              // Create a new Ingredient to track this recipe's output.
              // Its mermaPercent defaults to 0; user can configure it in the ingredients tab.
              const newProductIng = await Ingredient.create({
                name: recipe.name,
                aliases: [],
                quantityInStock: 0,
                mermaPercent: 0,
              });
              productIngId = String(newProductIng._id);
            }

            // Store the reference on the recipe for future lookups
            await Recipe.findByIdAndUpdate(
              recipeId,
              { $set: { productIngredientId: new Types.ObjectId(productIngId) } },
            );
          }

          // Add the net yield (after production loss) to product stock
          const updatedProduct = await updateIngredientStock(
            productIngId,
            netYieldGrams,
  );

          if (updatedProduct) {
            console.log(
              `Added ${netYieldGrams.toFixed(3)}g of "${updatedProduct.name}" (product of recipe "${recipe.name}", production loss: ${recipe.productionLossPercent || 0}%). New stock: ${updatedProduct.quantityInStock.toFixed(3)}g.`,
            );
          }
        } catch (productError) {
          console.error(
            `Failed to track product output for recipe ${recipeId}:`,
            productError,
          );
        }
      }
    }

    // --- Step 4: For ice cream recipes, auto-increment the recipe's mix stock ---
    // Mix is now on the Recipe, shared across all flavor variants.
    // Production loss applies uniformly.
    if (recipe.type === 'ice cream recipe') {
      const productionLossMultiplier = 1 - (recipe.productionLossPercent || 0) / 100;
      const netYieldGrams = recipe.baseYieldGrams * productionLossMultiplier;
      const mixKg = netYieldGrams / 1000;

      if (mixKg > 0 && recipe.baseFlavorId) {
        const updatedRecipe = await Recipe.findByIdAndUpdate(
          recipeId,
          { $inc: { iceCreamMixKg: mixKg } },
          { new: true },
        );

        if (!updatedRecipe) {
          console.warn(`Recipe ${recipeId} not found for mix increment.`);
        } else {
          console.log(
            `Added ${mixKg.toFixed(3)} kg of mix to recipe "${updatedRecipe.name}". New mix: ${updatedRecipe.iceCreamMixKg.toFixed(3)} kg.`,
          );

          // Log the production event on the base flavor
          const baseFlavor = await IceCreamFlavor.findById(recipe.baseFlavorId);
          if (baseFlavor) {
            await iceCreamEventService.logProduction(
              baseFlavor,
              recipeId,
              recipe.name,
              mixKg,
            );
          }
        }
      }
    }

    return getRecipeById(recipeId);
  } catch (error) {
    console.error(`Error finalizing recipe production for ID ${recipeId}:`, error);
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

    // Lean returns plain objects so we cast to a minimal interface rather than IRecipe (Document)
    return parentRecipes as unknown as IRecipe[]; // Cast if lean() is used and IRecipe is expected
  } catch (error) {
    console.error(`Error fetching dependent parent recipes for recipe ID ${recipeId}:`, error);
    throw new Error(`Failed to fetch dependent parent recipes for recipe ID ${recipeId}`);
  }
};