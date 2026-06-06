import { authFetch, apiFetch } from './auth-header';
import { API_BASE_URL } from './config';
import { RecipeDetails, CreateRecipeDto, UpdateRecipeDto } from '../types/recipe';

// Define the type for the recipe search results
export interface RecipeSearchResult {
  _id: string; // Expect _id from MongoDB
  name: string;
  // Add other relevant fields if the backend provides them and they are needed
}

// Define the possible type filters


// Define the structure for the API response when fetching recipes with pagination
export interface RecipeApiResponse {
  recipes: RecipeSearchResult[];
  totalPages: number;
  currentPage: number;
  // totalCount?: number; // Optional: if the API provides total number of items
}

/**
 * Fetches recipes from the backend API, supporting pagination and optional search term.
 * If searchTerm is provided and not empty, it filters recipes. Otherwise, it fetches all recipes paginated.
 * @param page The page number for pagination (1-based).
 * @param limit The number of items per page.
 * @param searchTerm Optional term to search for in recipe names or descriptions.
 * @returns A promise that resolves to a RecipeApiResponse containing recipes and pagination details.
 */
export const fetchRecipes = async (
  page: number,
  limit: number,
  searchTerm?: string
): Promise<RecipeApiResponse> => {
  const apiUrl = new URL(`${API_BASE_URL}/recipes`, window.location.origin);

  apiUrl.searchParams.append('page', page.toString());
  apiUrl.searchParams.append('limit', limit.toString());

  if (searchTerm && searchTerm.trim() !== '') {
    apiUrl.searchParams.append('searchTerm', searchTerm.trim());
  }

  // Note: typeFilter functionality has been removed from this specific function
  // as per the current requirements. If needed elsewhere, it might require
  // a separate function or re-adding it as an optional parameter.

  try {
    const response = await authFetch(apiUrl.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const recipesArray: RecipeSearchResult[] = await response.json(); // Backend is expected to return an array directly
    const totalCountHeader = response.headers.get('x-total-count');
    const totalCount = parseInt(totalCountHeader || '0', 10); // Default to 0 if header is not present or empty

    // Calculate totalPages, ensuring it's at least 1
    // If totalCount is 0 (e.g. header missing or no items), totalPages will be Math.ceil(0/limit) || 1 => 0 || 1 => 1
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      recipes: recipesArray,
      totalPages: totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    throw error;
  }
};

// The getAllRecipes function is now effectively covered by calling
// fetchRecipes(page, limit) without a searchTerm.
// It has been removed to avoid redundancy.

/**
 * Fetches a single recipe's details from the backend API by its ID.
 * @param recipeId The ID of the recipe to fetch.
 * @returns A promise that resolves to the RecipeDetails.
 */
export const fetchRecipeById = async (recipeId: string): Promise<RecipeDetails> => {
  return apiFetch<RecipeDetails>(`${API_BASE_URL}/recipes/${recipeId}`);
};

/**
 * Creates a new recipe via the backend API.
 * @param recipeData The data for the new recipe.
 * @returns A promise that resolves to the created RecipeDetails.
 */
export const createRecipe = async (recipeData: CreateRecipeDto): Promise<RecipeDetails> => {
  return apiFetch<RecipeDetails>(`${API_BASE_URL}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipeData),
  });
};

/**
 * Updates an existing recipe via the backend API.
 * @param id The ID of the recipe to update.
 * @param recipeData The data to update the recipe with.
 * @returns A promise that resolves to the updated RecipeDetails.
 */
export const updateRecipe = async (id: string, recipeData: UpdateRecipeDto): Promise<RecipeDetails> => {
  return apiFetch<RecipeDetails>(`${API_BASE_URL}/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipeData),
  });
};

/**
 * Represents the result of a recipe deletion attempt.
 */
export interface DeleteRecipeResult {
  success: boolean;
  isConflict: boolean;
  dependentParentRecipes?: RecipeDetails[];
  error?: string;
  status?: number;
}

/**
 * Deletes a recipe via the backend API.
 * @param id The ID of the recipe to delete.
 * @returns A promise that resolves to a DeleteRecipeResult.
 */
export const deleteRecipe = async (id: string): Promise<DeleteRecipeResult> => {
  const apiUrl = `${API_BASE_URL}/recipes/${id}`;

  try {
    const response = await authFetch(apiUrl, {
      method: 'DELETE',
    });

    if (response.ok) { // Typically 200 OK or 204 No Content for successful DELETE
      return { success: true, isConflict: false, status: response.status };
    }

    // Handle 409 Conflict specifically
    if (response.status === 409) {
      const conflictData = await response.json();
      const dependencies = (conflictData.dependencies || []).map((dep: { _id: string; name: string }) => ({
        _id: dep._id,
        name: dep.name,
        ingredients: [] as { ingredient: { _id: string; name: string }; amountGrams: number }[],
        steps: [] as string[],
        type: 'ice cream recipe' as const,
        baseYieldGrams: 0,
        linkedRecipes: [] as { recipe: { _id: string; name: string }; amountGrams: number }[],
      }));
      return {
        success: false,
        isConflict: true,
        dependentParentRecipes: dependencies,
        error: conflictData.message || 'Recipe is in use by other recipes.',
        status: response.status,
      };
    }

    // Handle other errors
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
    const errorMessage = `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`;
    console.error(`Failed to delete recipe with ID ${id}:`, errorMessage);
    return {
      success: false,
      isConflict: false,
      error: errorMessage,
      status: response.status,
    };

  } catch (error: unknown) {
    console.error(`Failed to delete recipe with ID ${id}:`, error);
    let errorMessage = 'An unexpected error occurred during deletion.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      success: false,
      isConflict: false,
      error: errorMessage,
    };
  }
};
/**
 * Fetches the dependencies for a given recipe.
 * @param recipeId The ID of the recipe to check for dependencies.
 * @returns A promise that resolves to an array of RecipeDetails representing the parent recipes that depend on this recipe.
 */
export const getRecipeDependencies = async (recipeId: string): Promise<RecipeDetails[]> => {
  return apiFetch<RecipeDetails[]>(`${API_BASE_URL}/recipes/${recipeId}/dependencies`);
};

/**
 * Finalizes the production of a recipe, spending ingredients.
 * Optionally adds ice-cream mix to the specified flavor.
 * @param recipeId The ID of the recipe to finalize.
 * @param flavorId Optional ID of the ice-cream flavor to add mix to.
 * @returns A promise that resolves when the finalization is successful.
 */
export const finalizeRecipeProductionApi = async (
  recipeId: string,
  flavorId?: string,
): Promise<void> => {
  const body: Record<string, string> = {};
  if (flavorId) body.flavorId = flavorId;

  await apiFetch<void>(`${API_BASE_URL}/recipes/${recipeId}/finalize-production`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};