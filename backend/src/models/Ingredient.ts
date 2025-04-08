import { Schema, model, Document } from 'mongoose';

// Interface representing the Ingredient document structure
export interface IIngredient extends Document {
  name: string;
  isAllergen: boolean;
  aliases: string[];
}

// Mongoose schema definition for Ingredient
const ingredientSchema = new Schema<IIngredient>({
  name: {
    type: String,
    required: true,
    unique: true, // Ensure ingredient names are unique
    trim: true, // Remove leading/trailing whitespace
  },
  isAllergen: {
    type: Boolean,
    default: false, // Default to not being an allergen
  },
  aliases: {
    type: [String],
    default: [], // Default to an empty array
    index: true, // Index aliases for faster searching
  },
});

// Create and export the Mongoose model
const Ingredient = model<IIngredient>('Ingredient', ingredientSchema);

export default Ingredient;