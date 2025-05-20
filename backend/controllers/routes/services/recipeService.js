"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeRecipeProduction = exports.deleteRecipe = exports.updateRecipe = exports.getRecipeById = exports.getAllRecipes = exports.createRecipe = void 0;
const Recipe_1 = __importDefault(require("../models/Recipe"));
const mongoose_1 = require("mongoose");
const ingredientService_1 = require("./ingredientService"); // Added import
/**
 * Creates a new recipe in the database.
 * @param recipeData - The data for the new recipe.
 * @returns The created recipe document.
 * @throws Throws an error if recipe creation fails.
 */
const createRecipe = async (recipeData) => {
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
        }
        else if (!dataToSave.baseYieldGrams) {
            // If baseYieldGrams is missing, assume 1000 (or handle as error if required)
            // For now, let's default it to 1000 if missing. Consider validation upstream.
            dataToSave.baseYieldGrams = 1000;
        }
        const newRecipeInstance = new Recipe_1.default(dataToSave); // Use potentially scaled data
        const savedRecipe = await newRecipeInstance.save(); // Save the instance
        // Populate the saved document before returning
        await savedRecipe.populate('ingredients.ingredient', 'name isAllergen');
        await savedRecipe.populate('linkedRecipes.recipe', 'name');
        return savedRecipe;
    }
    catch (error) {
        console.error('Error creating recipe:', error);
        // Re-throw the error to be handled by the controller
        throw new Error('Failed to create recipe');
    }
};
exports.createRecipe = createRecipe;
/**
 * Retrieves all recipes, optionally filtering by type and searching by name.
 * Populates ingredient and linked recipe details.
 * @param filter - Optional filter criteria (type, searchTerm).
 * @returns A promise resolving to an array of recipe documents.
 */
const getAllRecipes = async (filter = {}) => {
    try {
        const query = {};
        if (filter.type) {
            query.type = filter.type;
        }
        if (filter.searchTerm) {
            // Case-insensitive search on the name field
            query.name = { $regex: filter.searchTerm, $options: 'i' };
        }
        const recipes = await Recipe_1.default.find(query)
            .populate('ingredients.ingredient', 'name isAllergen') // Populate ingredient details
            .populate('linkedRecipes.recipe', 'name') // Populate linked recipe names
            .sort({ name: 1 }) // Optional: sort by name
            .exec();
        return recipes;
    }
    catch (error) {
        console.error('Error fetching recipes:', error);
        return []; // Return empty array on error
    }
};
exports.getAllRecipes = getAllRecipes;
/**
 * Retrieves a single recipe by its ID, populating related data.
 * @param id - The ID of the recipe to retrieve.
 * @returns A promise resolving to the recipe document or null if not found or invalid ID.
 */
const getRecipeById = async (id) => {
    try {
        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            console.warn(`Invalid recipe ID format: ${id}`);
            return null;
        }
        const recipe = await Recipe_1.default.findById(id)
            .populate('ingredients.ingredient', 'name isAllergen') // Populate ingredient details
            .populate('linkedRecipes.recipe', 'name') // Populate linked recipe names
            .exec();
        if (!recipe) {
            console.warn(`Recipe not found with ID: ${id}`);
            return null;
        }
        return recipe;
    }
    catch (error) {
        console.error(`Error fetching recipe with ID ${id}:`, error);
        return null; // Return null on error
    }
};
exports.getRecipeById = getRecipeById;
/**
 * Updates an existing recipe by its ID.
 * @param id - The ID of the recipe to update.
 * @param updates - An object containing the fields to update.
 * @returns A promise resolving to the updated recipe document or null if not found.
 */
const updateRecipe = async (id, updates) => {
    try {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            console.warn(`Invalid recipe ID format for update: ${id}`);
            return null;
        }
        // Find and update the recipe, return the *new* document after update
        const updatedRecipe = await Recipe_1.default.findByIdAndUpdate(id, updates, {
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
        const currentTotalYield = ingredients.reduce((sum, ing) => sum + (ing.amountGrams || 0), 0) +
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
        }
        else if (updatedRecipe.baseYieldGrams !== 1000) {
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
    }
    catch (error) {
        console.error(`Error updating recipe with ID ${id}:`, error);
        // Check for specific validation errors if needed, otherwise return null
        return null;
    }
};
exports.updateRecipe = updateRecipe;
/**
 * Deletes a recipe by its ID.
 * @param id - The ID of the recipe to delete.
 * @returns A promise resolving to the deleted recipe document or null if not found.
 */
const deleteRecipe = async (id) => {
    try {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            console.warn(`Invalid recipe ID format for delete: ${id}`);
            return null;
        }
        const deletedRecipe = await Recipe_1.default.findByIdAndDelete(id).exec();
        if (!deletedRecipe) {
            console.warn(`Recipe not found for deletion with ID: ${id}`);
            return null;
        }
        // Note: The deleted document is returned, but it won't have populated fields
        // If populated fields were needed *after* deletion, you'd fetch it first.
        return deletedRecipe;
    }
    catch (error) {
        console.error(`Error deleting recipe with ID ${id}:`, error);
        return null; // Return null on error
    }
};
exports.deleteRecipe = deleteRecipe;
/**
 * Finalizes the production of a recipe, deducting ingredient stock.
 * @param recipeId - The ID of the recipe to finalize.
 * @returns The recipe document, possibly with an updated status.
 * @throws Throws an error if the recipe is not found or if a critical error occurs during stock update.
 */
const finalizeRecipeProduction = async (recipeId) => {
    try {
        const recipe = await (0, exports.getRecipeById)(recipeId);
        if (!recipe) {
            console.error(`Recipe not found with ID: ${recipeId} for finalization.`);
            throw new Error(`Recipe not found with ID: ${recipeId}`);
        }
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            for (const recipeIngredient of recipe.ingredients) {
                // Ensure recipeIngredient.ingredient is populated and has an _id
                if (!recipeIngredient.ingredient ||
                    typeof recipeIngredient.ingredient === 'string' || // if not populated, it's an ObjectId string
                    !recipeIngredient.ingredient._id) {
                    console.warn(`Ingredient details missing for an ingredient in recipe ${recipeId}. Skipping stock update for this item.`);
                    continue;
                }
                const ingredientId = recipeIngredient.ingredient._id.toString();
                const changeInQuantity = -recipeIngredient.amountGrams;
                try {
                    const updatedIngredient = await (0, ingredientService_1.updateIngredientStock)(ingredientId, changeInQuantity);
                    if (!updatedIngredient) {
                        console.warn(`Ingredient with ID ${ingredientId} not found during stock update for recipe ${recipeId}. Stock not deducted.`);
                        // Decide if this should be a critical error or just a warning
                    }
                    else {
                        console.log(`Stock for ingredient ${updatedIngredient.name} (ID: ${ingredientId}) updated by ${changeInQuantity}. New stock: ${updatedIngredient.quantityInStock}`);
                        if (updatedIngredient.quantityInStock < 0) {
                            console.warn(`Stock for ingredient ${updatedIngredient.name} (ID: ${ingredientId}) is now negative: ${updatedIngredient.quantityInStock}.`);
                        }
                    }
                }
                catch (stockUpdateError) {
                    console.error(`Failed to update stock for ingredient ID ${ingredientId} in recipe ${recipeId}:`, stockUpdateError);
                    // Depending on requirements, you might want to re-throw or collect errors
                    // For now, log and continue to attempt to update other ingredients
                }
            }
        }
        else {
            console.log(`Recipe ${recipeId} has no ingredients to deduct stock from.`);
        }
        // TODO: Update recipe status if applicable (e.g., recipe.status = 'PRODUCTION_FINALIZED')
        // const updatedRecipe = await updateRecipe(recipeId, { status: 'FINALIZED' });
        // For now, return the original recipe fetched, as status update is secondary
        // If a status update is implemented and returns the updated recipe, return that instead.
        // Re-fetch the recipe to ensure all populated fields are fresh if no direct status update is made here
        // or if the recipe object itself needs to reflect some change not covered by ingredient updates.
        // However, getRecipeById already populates. If no direct changes to the recipe doc itself, this might be redundant.
        return (0, exports.getRecipeById)(recipeId); // Return the recipe, potentially for the controller to send back
    }
    catch (error) {
        console.error(`Error finalizing recipe production for ID ${recipeId}:`, error);
        // Re-throw the error to be handled by the controller
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to finalize recipe production.');
    }
};
exports.finalizeRecipeProduction = finalizeRecipeProduction;
