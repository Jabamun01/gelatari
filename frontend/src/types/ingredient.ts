/**
 * Represents the structure of an ingredient as received from the backend.
 */
export interface Ingredient {
  _id: string; // MongoDB ObjectId as string
  name: string;
  isAllergen: boolean;
}

/**
 * Data Transfer Object for creating a new ingredient.
 * Contains the fields required by the backend API.
 */
export interface CreateIngredientDto {
  name: string;
  isAllergen: boolean;
}

/**
 * Data Transfer Object for updating an existing ingredient.
 * Contains only the fields that are allowed to be updated via the API.
 */
export interface UpdateIngredientDto {
  // Only include fields that the frontend should be able to modify.
  // Based on the prompt, only allergen status is explicitly mentioned for update.
  isAllergen?: boolean;
  // name?: string; // Consider if name updates are needed/allowed. Omitting for now as per prompt suggestion.
}