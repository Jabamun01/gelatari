import { Schema, model, Document, Types } from 'mongoose';
// No need to import IIngredient directly, Types.ObjectId is sufficient for refs

// Interface for the ingredient subdocument within a recipe
export interface IRecipeIngredient {
  ingredient: Types.ObjectId; // Reference to an Ingredient document
  amountGrams: number;
}

// Interface for the linked recipe subdocument within a recipe
export interface ILinkedRecipe {
  recipe: Types.ObjectId; // Reference to another Recipe document
  amountGrams: number;
}

// Interface representing the main Recipe document structure
export interface IRecipe extends Document {
  name: string;
  type: 'ice cream recipe' | 'not ice cream recipe';
  category?: 'ice cream' | 'sorbet'; // Optional, but required if type is 'ice cream recipe'
  ingredients: IRecipeIngredient[];
  steps: string[];
  baseYieldGrams: number;
  linkedRecipes: ILinkedRecipe[];
}

// Mongoose schema definition for Recipe
const recipeSchema = new Schema<IRecipe>(
  {
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
      required: function (this: IRecipe) {
        return this.type === 'ice cream recipe';
      },
    },
    ingredients: [
      {
        ingredient: {
          type: Schema.Types.ObjectId,
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
          type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  },
);

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
const Recipe = model<IRecipe>('Recipe', recipeSchema);

export default Recipe;
