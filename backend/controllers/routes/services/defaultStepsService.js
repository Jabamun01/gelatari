"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultStepsByCategory = void 0;
const DefaultSteps_1 = __importDefault(require("../models/DefaultSteps"));
/**
 * Retrieves the default steps for a given recipe category ('ice cream' or 'sorbet').
 * @param category - The category to fetch default steps for.
 * @returns A promise resolving to an array of step strings, or null if not found or on error.
 */
const getDefaultStepsByCategory = async (category) => {
    try {
        // Find the document matching the category
        const defaultStepsDoc = await DefaultSteps_1.default.findOne({ category }).exec();
        if (defaultStepsDoc) {
            // Return the steps array if the document is found
            return defaultStepsDoc.steps;
        }
        else {
            // Return null if no document matches the category
            console.warn(`Default steps not found for category: ${category}`);
            return null;
        }
    }
    catch (error) {
        console.error(`Error fetching default steps for category ${category}:`, error);
        // Return null in case of any database error
        return null;
    }
};
exports.getDefaultStepsByCategory = getDefaultStepsByCategory;
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
