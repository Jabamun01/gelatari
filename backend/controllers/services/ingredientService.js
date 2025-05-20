"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecipesByIngredientId = exports.updateIngredientStock = exports.addAliasToIngredient = exports.deleteIngredient = exports.updateIngredientById = exports.updateIngredient = exports.getIngredientById = exports.getAllIngredients = exports.createIngredient = void 0;
const Ingredient_1 = __importDefault(require("../models/Ingredient"));
const mongoose_1 = __importDefault(require("mongoose"));
const Recipe_1 = __importDefault(require("../models/Recipe")); // Import Recipe model and IRecipe for dependency check
// Helper to escape regex special characters
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
/**
 * Helper function to find a conflicting term (name or alias) in the database.
 * Checks if the given `nameToCheck` or any of `aliasesToCheck`
 * already exist as a name or alias in the Ingredient collection (case-insensitively).
 * `excludeId` can be provided to exclude a specific ingredient from the check (useful for updates).
 * @param nameToCheck - The name to check for conflicts.
 * @param aliasesToCheck - An array of aliases to check for conflicts.
 * @param excludeId - Optional ID of the ingredient to exclude from the search.
 * @returns The conflicting term (original casing) if found, otherwise null.
 */
const findConflictingTermInDB = async (nameToCheck, aliasesToCheck, excludeId) => {
    const terms = [];
    if (nameToCheck && nameToCheck.trim() !== "") {
        terms.push({ original: nameToCheck, lower: nameToCheck.toLowerCase() });
    }
    if (aliasesToCheck) {
        aliasesToCheck.forEach(alias => {
            if (alias && alias.trim() !== "") { // Ensure alias is not empty and not just whitespace
                terms.push({ original: alias, lower: alias.toLowerCase() });
            }
        });
    }
    if (terms.length === 0) {
        return null; // No valid terms to check
    }
    // Get unique lowercase terms to search for in DB
    const uniqueLowerTerms = [...new Set(terms.map(t => t.lower))].filter(Boolean);
    if (uniqueLowerTerms.length === 0) {
        return null;
    }
    const orConditions = uniqueLowerTerms.flatMap(lowerTerm => [
        { name: { $regex: `^${escapeRegex(lowerTerm)}$`, $options: 'i' } },
        { aliases: { $elemMatch: { $regex: `^${escapeRegex(lowerTerm)}$`, $options: 'i' } } }
    ]);
    const query = { $or: orConditions };
    if (excludeId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(excludeId)) {
            // This case should ideally be handled by the caller, but as a safeguard:
            console.warn(`Invalid excludeId provided to findConflictingTermInDB: ${excludeId}`);
            // Proceed without excluding, or throw error, depending on desired strictness
        }
        else {
            query._id = { $ne: new mongoose_1.default.Types.ObjectId(excludeId) };
        }
    }
    const conflictingDoc = await Ingredient_1.default.findOne(query).select('name aliases').lean();
    if (conflictingDoc) {
        const conflictingDocNameLower = conflictingDoc.name.toLowerCase();
        const conflictingDocAliasesLower = conflictingDoc.aliases.map(a => a.toLowerCase());
        for (const term of terms) {
            if (uniqueLowerTerms.includes(term.lower)) { // Only check terms that were part of the search
                if (term.lower === conflictingDocNameLower) {
                    return term.original;
                }
                if (conflictingDocAliasesLower.includes(term.lower)) {
                    return term.original;
                }
            }
        }
        // Fallback: if a conflict was found by uniqueLowerTerms, identify which one
        for (const lowerTerm of uniqueLowerTerms) {
            if (lowerTerm === conflictingDocNameLower) {
                const originalTerm = terms.find(t => t.lower === lowerTerm);
                return originalTerm ? originalTerm.original : conflictingDoc.name; // Fallback to DB name
            }
            if (conflictingDocAliasesLower.includes(lowerTerm)) {
                const originalTerm = terms.find(t => t.lower === lowerTerm);
                const dbAlias = conflictingDoc.aliases.find(a => a.toLowerCase() === lowerTerm);
                return originalTerm ? originalTerm.original : dbAlias || lowerTerm; // Fallback to DB alias or term
            }
        }
        // Should be rare, but if specific term not pinpointed, return first input term that was part of search
        return terms.find(term => uniqueLowerTerms.includes(term.lower))?.original || "Unknown term";
    }
    return null;
};
/**
 * Creates a new ingredient in the database.
 * @param name - The name of the ingredient.
 * @param aliases - Optional array of aliases for the ingredient.
 * @returns The created ingredient document.
 * @throws Error if creation fails (e.g., duplicate name).
 */
const createIngredient = async (name, aliases, quantityInStock // Added for clarity, though model defaults
) => {
    try {
        const checkName = name ? name.trim() : "";
        const checkAliases = aliases ? aliases.map(a => a.trim()).filter(a => a !== "") : [];
        if (!checkName) {
            const err = new Error('Ingredient name cannot be empty.');
            err.statusCode = 400; // Bad Request
            throw err;
        }
        const conflictingTerm = await findConflictingTermInDB(checkName, checkAliases);
        if (conflictingTerm) {
            const err = new Error(`Ingredient name/alias '${conflictingTerm}' already exists.`);
            err.statusCode = 409; // Conflict
            throw err;
        }
        const ingredientData = { name: checkName, aliases: checkAliases };
        if (quantityInStock !== undefined) {
            ingredientData.quantityInStock = quantityInStock;
        }
        const newIngredient = new Ingredient_1.default(ingredientData);
        await newIngredient.save();
        return newIngredient;
    }
    catch (error) {
        // Log if it's not one of our custom errors with statusCode
        if (!error.statusCode) {
            console.error('Error creating ingredient:', error);
        }
        // Handle specific MongoDB duplicate key error for 'name' (as a fallback)
        if (error.code === 11000) {
            // This might be redundant if findConflictingTermInDB catches it, but good for direct name conflict
            const err = new Error(`Ingredient name '${name}' already exists (database constraint).`);
            err.statusCode = 409;
            throw err;
        }
        if (error.statusCode) { // Re-throw custom errors
            throw error;
        }
        throw new Error('Failed to create ingredient.');
    }
};
exports.createIngredient = createIngredient;
/**
 * Retrieves ingredients from the database with pagination, optionally filtering by name or alias (case-insensitive).
 * @param searchTerm - Optional term to filter by (matches name or alias).
 * @param page - The page number to retrieve (1-based).
 * @param limit - The number of items per page.
 * @returns An object containing the paginated ingredients and pagination metadata.
 * @throws Error if retrieval fails.
 */
const getAllIngredients = async (searchTerm, page = 1, limit = 10) => {
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
        const totalCount = await Ingredient_1.default.countDocuments(filter);
        // Fetch the paginated ingredients
        const ingredients = await Ingredient_1.default.find(filter)
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
    }
    catch (error) {
        console.error('Error fetching ingredients with pagination:', error);
        throw new Error('Failed to fetch ingredients.');
    }
};
exports.getAllIngredients = getAllIngredients;
/**
 * Retrieves a single ingredient by its ID.
 * @param id - The ID of the ingredient to retrieve.
 * @returns The ingredient document or null if not found or ID is invalid.
 */
const getIngredientById = async (id) => {
    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        console.warn(`Invalid ingredient ID format: ${id}`);
        return null;
    }
    try {
        const ingredient = await Ingredient_1.default.findById(id);
        return ingredient; // Returns null if not found by findById
    }
    catch (error) {
        console.error(`Error fetching ingredient by ID ${id}:`, error);
        // In case of CastError or other unexpected errors during findById
        return null;
    }
};
exports.getIngredientById = getIngredientById;
/**
 * Updates an existing ingredient by its ID.
 * @param id - The ID of the ingredient to update.
 * @param updates - An object containing the fields to update (name).
 * @returns The updated ingredient document or null if not found or ID is invalid.
 */
const updateIngredient = async (id, updates) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        console.warn(`Invalid ingredient ID format for update: ${id}`);
        return null;
    }
    try {
        // { new: true } returns the modified document rather than the original
        const updatedIngredient = await Ingredient_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        return updatedIngredient; // Returns null if ID not found
    }
    catch (error) {
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
exports.updateIngredient = updateIngredient;
/**
 * Updates an existing ingredient by its ID with the provided data.
 * Can update name, aliases, and quantityInStock.
 * @param id - The ID of the ingredient to update.
 * @param updateData - An object containing the fields to update: { name?: string; aliases?: string[]; quantityInStock?: number }.
 * @returns The updated ingredient document or null if not found or ID is invalid.
 * @throws Error if the update fails (e.g., duplicate name, validation error).
 */
const updateIngredientById = async (id, updateData) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        console.warn(`Invalid ingredient ID format for update: ${id}`);
        // Optionally throw an error or return a specific response
        const err = new Error(`Invalid ingredient ID format: ${id}`);
        err.statusCode = 400; // Bad Request
        throw err;
    }
    // Initialize updatesToApply here to make it available in the catch block
    const updatesToApply = {};
    try {
        let performConflictCheck = false;
        if (updateData.hasOwnProperty('name')) {
            const newName = updateData.name ? updateData.name.trim() : "";
            if (!newName) {
                const err = new Error('Ingredient name cannot be empty if provided for update.');
                err.statusCode = 400;
                throw err;
            }
            updatesToApply.name = newName;
            performConflictCheck = true;
        }
        if (updateData.hasOwnProperty('aliases')) {
            // Ensure aliases is an array, trim, and filter empty strings
            updatesToApply.aliases = Array.isArray(updateData.aliases)
                ? updateData.aliases.map(a => (typeof a === 'string' ? a.trim() : '')).filter(a => a !== "")
                : []; // Default to empty array if not an array or null/undefined
            performConflictCheck = true;
        }
        if (updateData.hasOwnProperty('quantityInStock')) {
            updatesToApply.quantityInStock = updateData.quantityInStock;
        }
        if (Object.keys(updatesToApply).length === 0) {
            const currentIngredient = await Ingredient_1.default.findById(id);
            return currentIngredient;
        }
        if (performConflictCheck) {
            // Only check terms that are being updated
            const nameToCheck = updatesToApply.name; // This will be the new name if provided
            const aliasesToCheck = updatesToApply.aliases; // This will be the new list of aliases if provided
            const conflictingTerm = await findConflictingTermInDB(nameToCheck, aliasesToCheck, id);
            if (conflictingTerm) {
                const err = new Error(`Ingredient name/alias '${conflictingTerm}' already exists.`);
                err.statusCode = 409; // Conflict
                throw err;
            }
        }
        const updatedIngredient = await Ingredient_1.default.findByIdAndUpdate(id, { $set: updatesToApply }, { new: true, runValidators: true });
        if (!updatedIngredient) {
            // If not found after attempting update (and no other error thrown)
            const err = new Error(`Ingredient with ID ${id} not found.`);
            err.statusCode = 404; // Not Found
            throw err;
        }
        return updatedIngredient;
    }
    catch (error) {
        // Log if it's not one of our custom errors with statusCode
        if (!error.statusCode) {
            console.error(`Error updating ingredient by ID ${id} with data ${JSON.stringify(updateData)}:`, error);
        }
        // Handle specific MongoDB duplicate key error for 'name' (as a fallback)
        if (error.code === 11000 && updatesToApply.name !== undefined) {
            const err = new Error(`Ingredient name '${updatesToApply.name}' already exists (database constraint).`);
            err.statusCode = 409;
            throw err;
        }
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const err = new Error(`Validation failed: ${error.message}`);
            err.statusCode = 400; // Bad Request for validation errors
            throw err;
        }
        if (error.statusCode) { // Re-throw custom errors
            throw error;
        }
        // For other types of errors, throw a generic error
        throw new Error(`Failed to update ingredient with ID ${id}.`);
    }
};
exports.updateIngredientById = updateIngredientById;
/**
 * Deletes an ingredient by its ID.
 * @param id - The ID of the ingredient to delete.
 * @returns The deleted ingredient document if successful.
 * @throws Error if the ingredient is used in recipes, including a list of dependent recipes.
 * @throws Error if the ID is invalid or deletion fails for other reasons.
 */
const deleteIngredient = async (id) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        console.warn(`Invalid ingredient ID format for delete: ${id}`);
        // Consider throwing a specific error type or returning a more informative object
        throw new Error(`Invalid ingredient ID format: ${id}`);
    }
    try {
        // Check if the ingredient is used in any recipes
        const recipesUsingIngredient = await Recipe_1.default.find({ 'ingredients.ingredient': id }).select('name _id');
        if (recipesUsingIngredient.length > 0) {
            // Ingredient is in use, do not delete
            const error = new Error('Ingredient is currently used in recipes and cannot be deleted.');
            error.statusCode = 409; // Conflict
            error.isOperational = true; // Mark as an operational error
            error.details = {
                message: `Ingredient with ID ${id} is used in the following recipes:`,
                recipes: recipesUsingIngredient.map(recipe => ({ id: recipe._id, name: recipe.name })),
            };
            throw error;
        }
        // Ingredient is not used in any recipes, proceed with deletion
        const deletedIngredient = await Ingredient_1.default.findByIdAndDelete(id);
        if (!deletedIngredient) {
            // If findByIdAndDelete returns null, the ingredient was not found
            const error = new Error('Ingredient not found for deletion.');
            error.statusCode = 404; // Not Found
            error.isOperational = true;
            throw error;
        }
        return deletedIngredient;
    }
    catch (error) {
        console.error(`Error deleting ingredient by ID ${id}:`, error);
        // Re-throw operational errors to be handled by the controller
        if (error.isOperational) {
            throw error;
        }
        // For non-operational errors, throw a generic error
        throw new Error(`Failed to delete ingredient with ID ${id}.`);
    }
};
exports.deleteIngredient = deleteIngredient;
/**
 * Adds an alias to an existing ingredient.
 * @param id - The ID of the ingredient to update.
 * @param alias - The alias string to add.
 * @returns The updated ingredient document or null if not found, ID is invalid, or alias already exists.
 * @throws Error if the alias already exists on another ingredient.
 */
const addAliasToIngredient = async (id, alias) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        console.warn(`Invalid ingredient ID format for adding alias: ${id}`);
        return null;
    }
    try {
        // 1. Check if the alias already exists on *another* ingredient (name or alias)
        const existingIngredientWithAlias = await Ingredient_1.default.findOne({
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
        const updatedIngredient = await Ingredient_1.default.findOneAndUpdate({
            _id: id,
            // Ensure the alias (case-insensitive) doesn't already exist in the name or aliases array
            name: { $not: { $regex: `^${alias}$`, $options: 'i' } },
            aliases: { $not: { $regex: `^${alias}$`, $options: 'i' } }
        }, { $addToSet: { aliases: alias } }, // Use $addToSet to avoid duplicates within the same ingredient
        { new: true } // Return the updated document
        );
        if (!updatedIngredient) {
            // This could happen if the ingredient wasn't found OR if the alias already exists on this ingredient
            const ingredient = await Ingredient_1.default.findById(id);
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
    }
    catch (error) {
        console.error(`Error adding alias "${alias}" to ingredient ID ${id}:`, error);
        // Re-throw specific errors like the one we created
        if (error.message.startsWith('Alias')) {
            throw error;
        }
        return null; // Return null for other errors
    }
};
exports.addAliasToIngredient = addAliasToIngredient;
/**
 * Updates the stock quantity of an ingredient by a given amount.
 * @param ingredientId - The ID of the ingredient to update.
 * @param changeInQuantity - The amount to add to (or subtract from) the current stock.
 * @returns The updated ingredient document or null if not found or ID is invalid.
 * @throws Error if the update fails for other reasons.
 */
const updateIngredientStock = async (ingredientId, changeInQuantity) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(ingredientId)) {
        console.warn(`Invalid ingredient ID format for stock update: ${ingredientId}`);
        return null;
    }
    try {
        const updatedIngredient = await Ingredient_1.default.findByIdAndUpdate(ingredientId, { $inc: { quantityInStock: changeInQuantity } }, { new: true, runValidators: true } // Return the updated document and run schema validators
        );
        if (!updatedIngredient) {
            console.warn(`Ingredient with ID ${ingredientId} not found for stock update.`);
            return null;
        }
        // Ensure stock doesn't go below zero if that's a business rule (can be handled by validator too)
        // For now, allowing negative stock as per "changeInQuantity can be ... negative"
        // if (updatedIngredient.quantityInStock < 0) {
        //   // Potentially revert or set to 0 if negative stock is not allowed
        //   // This example allows it based on instruction "changeInQuantity can be ... negative"
        // }
        return updatedIngredient;
    }
    catch (error) {
        console.error(`Error updating stock for ingredient ID ${ingredientId}:`, error);
        // Handle potential validation errors if any were added to quantityInStock (e.g., min value)
        if (error.name === 'ValidationError') {
            throw new Error(`Validation failed for stock update: ${error.message}`);
        }
        throw new Error('Failed to update ingredient stock.'); // Generic error for other failures
    }
};
exports.updateIngredientStock = updateIngredientStock;
/**
 * Retrieves all recipes that include a specific ingredient.
 * @param ingredientId - The ID of the ingredient to search for in recipes.
 * @returns A promise that resolves to an array of recipe documents.
 * @throws Error if there's a database error during the query.
 */
const getRecipesByIngredientId = async (ingredientId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(ingredientId)) {
        console.warn(`Invalid ingredient ID format for fetching dependent recipes: ${ingredientId}`);
        // Depending on desired behavior, could throw an error or return empty array
        // For now, returning empty as if no dependencies found for an invalid ID
        return [];
    }
    try {
        const recipes = await Recipe_1.default.find({ 'ingredients.ingredient': ingredientId });
        return recipes;
    }
    catch (error) {
        console.error(`Error fetching recipes by ingredient ID ${ingredientId}:`, error);
        throw new Error('Failed to fetch recipes by ingredient ID.');
    }
};
exports.getRecipesByIngredientId = getRecipesByIngredientId;
