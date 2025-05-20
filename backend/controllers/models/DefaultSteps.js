"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Mongoose schema definition for DefaultSteps
const defaultStepsSchema = new mongoose_1.Schema({
    category: {
        type: String,
        enum: ['ice cream', 'sorbet'],
        required: true,
        unique: true, // Ensure category is unique
    },
    steps: [
        {
            type: String,
            required: true,
            trim: true, // Trim whitespace from steps
        },
    ],
});
// Create and export the Mongoose model
const DefaultSteps = (0, mongoose_1.model)('DefaultSteps', defaultStepsSchema);
exports.default = DefaultSteps;
