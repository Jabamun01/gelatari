import { Schema, model, Document } from 'mongoose';

// Interface representing the Ingredient document structure
export interface IIngredient extends Document {
  name: string;
  aliases: string[];
  quantityInStock: number;
}

// Mongoose schema definition for Ingredient
const ingredientSchema = new Schema<IIngredient>({
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
const Ingredient = model<IIngredient>('Ingredient', ingredientSchema);

export default Ingredient;