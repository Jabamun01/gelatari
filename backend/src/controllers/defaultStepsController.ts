import { Request, Response } from 'express';
import { getDefaultStepsByCategory, createOrUpdateDefaultSteps } from '../services/defaultStepsService';

/**
 * Handles requests to fetch default steps based on recipe category.
 * Expects 'category' as a URL parameter.
 */
export const getDefaultStepsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;

    // Validate the category parameter
    if (!category || (category !== 'ice cream' && category !== 'sorbet')) {
      res.status(400).json({ message: 'Invalid or missing category parameter. Must be "ice cream" or "sorbet".' });
      return; // Explicit return void
    }

    // Call the service function with the validated category
    const steps = await getDefaultStepsByCategory(category);

    if (steps) {
      // Steps found, send 200 OK with the steps array
      res.status(200).json({ steps: steps });
    } else {
      // Steps not found for the category (service returned null)
      res.status(404).json({ message: `Default steps not found for category: ${category}` });
    }

  } catch (error: any) {
    // Handle unexpected errors during service execution
    console.error(`Error in getDefaultStepsHandler for category ${req.params.category}:`, error);
    res.status(500).json({ message: 'Internal server error while fetching default steps.' });
  }
};

/**
 * Handles requests to create or update default steps for a given category.
 * Expects 'category' as a URL parameter and 'steps' in the request body.
 */
export const createOrUpdateDefaultStepsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const { steps } = req.body;

    // Validate category
    if (!category || typeof category !== 'string' || category.trim() === '') {
      res.status(400).json({ message: 'Invalid or missing category parameter.' });
      return;
    }

    // Validate steps
    if (!steps || !Array.isArray(steps) || !steps.every(step => typeof step === 'string')) {
      res.status(400).json({ message: 'Invalid or missing steps parameter. Must be an array of strings.' });
      return;
    }

    const result = await createOrUpdateDefaultSteps(category, steps);

    if (result) {
      // Check if the document was newly created or updated
      // Mongoose `findOneAndUpdate` with `upsert:true` doesn't directly tell us if it was an insert or update
      // without querying before. For simplicity, we'll return 200 for both.
      // A more sophisticated approach might involve checking `result.isNew` if available or comparing timestamps.
      res.status(200).json(result);
    } else {
      // Service function returned null, indicating an internal error during DB operation
      res.status(500).json({ message: `Failed to create or update default steps for category: ${category}` });
    }
  } catch (error: any) {
    console.error(`Error in createOrUpdateDefaultStepsHandler for category ${req.params.category}:`, error);
    res.status(500).json({ message: 'Internal server error while creating or updating default steps.' });
  }
};