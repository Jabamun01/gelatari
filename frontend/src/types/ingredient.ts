/**
 * Represents the structure of an ingredient as received from the backend.
 */
export interface Ingredient {
  _id: string; // MongoDB ObjectId as string
  name: string;
  aliases: string[];
  quantityInStock: number;
}

/**
 * Data Transfer Object for creating a new ingredient.
 * Contains the fields required by the backend API.
 */
export interface CreateIngredientDto {
  name: string;
  aliases?: string[]; // Optional when creating
  quantityInStock?: number; // Optional when creating
}

/**
 * Data Transfer Object for updating an existing ingredient.
 * Contains only the fields that are allowed to be updated via the API.
 */
export interface UpdateIngredientDto {
  // Only include fields that the frontend should be able to modify.
  name?: string; // Allow name updates
  aliases?: string[];
  quantityInStock?: number;
}