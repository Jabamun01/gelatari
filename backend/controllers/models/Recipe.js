"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Mongoose schema definition for Recipe
const recipeSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['ice cream recipe', 'not ice cream recipe'],
        required: true,
    },
    category: {
        type: String,
        enum: ['ice cream', 'sorbet'],
        // Conditionally required based on the 'type' field
        // Mongoose allows 'function' here to access 'this' context
        required: function () {
            return this.type === 'ice cream recipe';
        },
    },
    ingredients: [
        {
            ingredient: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Ingredient', // Reference the Ingredient model
                required: true,
            },
            amountGrams: {
                type: Number,
                required: true,
                min: 0, // Amount cannot be negative
            },
            _id: false, // Don't create an _id for subdocuments
        },
    ],
    steps: [
        {
            type: String,
            required: true,
            trim: true, // Trim whitespace from steps
        },
    ],
    baseYieldGrams: {
        type: Number,
        required: true,
        default: 1000, // Default yield if not specified
        min: 1, // Yield must be positive
    },
    linkedRecipes: [
        {
            recipe: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Recipe', // Self-reference to the Recipe model
                required: true,
            },
            amountGrams: {
                type: Number,
                required: true,
                min: 0, // Amount cannot be negative
            },
            _id: false, // Don't create an _id for subdocuments
        },
    ],
}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
});
// Pre-save hook to validate ingredients/steps based on linkedRecipes
recipeSchema.pre('save', function (next) {
    const hasIngredients = this.ingredients && this.ingredients.length > 0;
    const hasSteps = this.steps && this.steps.length > 0;
    const hasLinkedRecipes = this.linkedRecipes && this.linkedRecipes.length > 0;
    // If there are no ingredients AND no steps AND no linked recipes, throw error
    if (!hasIngredients && !hasSteps && !hasLinkedRecipes) {
        return next(new Error('A recipe must have at least one ingredient or step, unless it has linked recipes.'));
    }
    // Otherwise, validation passes
    next();
});
// Create and export the Mongoose model
const Recipe = (0, mongoose_1.model)('Recipe', recipeSchema);
exports.default = Recipe;
