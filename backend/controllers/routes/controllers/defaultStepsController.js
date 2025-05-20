"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultStepsHandler = void 0;
const defaultStepsService_1 = require("../services/defaultStepsService");
/**
 * Handles requests to fetch default steps based on recipe category.
 * Expects 'category' as a URL parameter.
 */
const getDefaultStepsHandler = async (req, res) => {
    try {
        const { category } = req.params;
        // Validate the category parameter
        if (!category || (category !== 'ice cream' && category !== 'sorbet')) {
            res.status(400).json({ message: 'Invalid or missing category parameter. Must be "ice cream" or "sorbet".' });
            return; // Explicit return void
        }
        // Call the service function with the validated category
        const steps = await (0, defaultStepsService_1.getDefaultStepsByCategory)(category);
        if (steps) {
            // Steps found, send 200 OK with the steps array
            res.status(200).json(steps);
        }
        else {
            // Steps not found for the category (service returned null)
            res.status(404).json({ message: `Default steps not found for category: ${category}` });
        }
    }
    catch (error) {
        // Handle unexpected errors during service execution
        console.error(`Error in getDefaultStepsHandler for category ${req.params.category}:`, error);
        res.status(500).json({ message: 'Internal server error while fetching default steps.' });
    }
};
exports.getDefaultStepsHandler = getDefaultStepsHandler;
