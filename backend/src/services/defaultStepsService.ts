import DefaultSteps, { IDefaultSteps } from '../models/DefaultSteps';

/**
 * Retrieves the default steps for a given recipe category ('ice cream' or 'sorbet').
 * @param category - The category to fetch default steps for.
 * @returns A promise resolving to an array of step strings, or null if not found or on error.
 */
export const getDefaultStepsByCategory = async (
  category: 'ice cream' | 'sorbet',
): Promise<string[] | null> => {
  try {
    // Find the document matching the category
    const defaultStepsDoc = await DefaultSteps.findOne({ category }).exec();

    if (defaultStepsDoc) {
      // Return the steps array if the document is found
      return defaultStepsDoc.steps;
    } else {
      // Return null if no document matches the category
      console.warn(`Default steps not found for category: ${category}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching default steps for category ${category}:`, error);
    // Return null in case of any database error
    return null;
  }
};

// Optional: Functions for creating/updating default steps could be added here
// if management via API is needed later. For now, manual seeding is assumed.
// Example (not required by current step):
/*
export const createOrUpdateDefaultSteps = async (
  category: 'ice cream' | 'sorbet',
  steps: string[]
): Promise<IDefaultSteps | null> => {
  try {
    const updatedDoc = await DefaultSteps.findOneAndUpdate(
      { category },
      { steps },
      { new: true, upsert: true, runValidators: true } // upsert: create if not found
    ).exec();
    return updatedDoc;
  } catch (error) {
    console.error(`Error creating/updating default steps for ${category}:`, error);
    return null;
  }
};
*/