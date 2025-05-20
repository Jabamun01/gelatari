"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Mongoose schema definition for Ingredient
const ingredientSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Ensure ingredient names are unique
        trim: true, // Remove leading/trailing whitespace
    },
    aliases: {
        type: [String],
        default: [], // Default to an empty array
        index: true, // Index aliases for faster searching
    },
    quantityInStock: {
        type: Number,
        // required: true, // Made optional, default will apply on creation if not provided
        default: 0,
    },
});
// Create and export the Mongoose model
const Ingredient = (0, mongoose_1.model)('Ingredient', ingredientSchema);
exports.default = Ingredient;
