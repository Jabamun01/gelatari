import { Ingredient, CreateIngredientDto, UpdateIngredientDto } from '../types/ingredient';
import { RecipeDetails } from '../types/recipe';
import { authFetch, apiFetch } from './auth-header';

// Define the structure for the paginated response
export interface PaginatedIngredientsResponse {
  data: Ingredient[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

// Type for the custom error when an ingredient is in use
export interface IngredientInUseErrorType {
  name: 'IngredientInUseError';
  message: string;
  dependentRecipes: RecipeDetails[];
}

// Type guard to check if an error is an IngredientInUseErrorType
export const isIngredientInUseError = (error: unknown): error is IngredientInUseErrorType => {
  if (error && typeof error === 'object') {
    // Check if the properties exist and have the correct type/value
    const nameCheck = 'name' in error && (error as { name: unknown }).name === 'IngredientInUseError';
    const recipesCheck = 'dependentRecipes' in error && Array.isArray((error as { dependentRecipes: unknown }).dependentRecipes);
    return nameCheck && recipesCheck;
  }
  return false;
};

import { API_BASE_URL } from './config';
const ingredientsApiUrl = `${API_BASE_URL}/ingredients`;

/**
 * Fetches ingredients from the backend API with pagination.
 * @param page - The page number to fetch (default: 1).
 * @param limit - The number of items per page (default: 10).
 * @param searchTerm - Optional term to filter ingredients by name or alias.
 * @returns A promise that resolves to a PaginatedIngredientsResponse object.
 */
export const getAllIngredients = async (
    page: number = 1,
    limit: number = 10,
    searchTerm?: string // Use searchTerm for filtering
): Promise<PaginatedIngredientsResponse> => {
  try {
    // Construct the URL with query parameters for pagination and filtering
    const url = new URL(ingredientsApiUrl, window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    if (searchTerm && searchTerm.trim() !== '') { // Add searchTerm filter if provided
        url.searchParams.append('searchTerm', searchTerm.trim());
    }

    const response = await authFetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const data: PaginatedIngredientsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch ingredients:', error);
    throw error; // Re-throw for react-query or other handlers
  }
};
/**
 * Fetches a single ingredient by its ID from the backend API.
 * @param ingredientId The ID of the ingredient to fetch.
 * @returns A promise that resolves to the Ingredient object.
 */
export const getIngredientById = async (ingredientId: string): Promise<Ingredient> => {
  const apiUrl = `${ingredientsApiUrl}/${ingredientId}`;
  try {
    const response = await authFetch(apiUrl);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Ingredient with ID ${ingredientId} not found.`);
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const data: Ingredient = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch ingredient with ID ${ingredientId}:`, error);
    throw error;
  }
};

/**
 * Creates a new ingredient via the backend API.
 * @param ingredientData The data for the new ingredient.
 * @returns A promise that resolves to the newly created Ingredient object.
 */
export const createIngredient = async (ingredientData: CreateIngredientDto): Promise<Ingredient> => {
  return apiFetch<Ingredient>(ingredientsApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredientData),
  });
};

/**
 * Updates an existing ingredient via the backend API.
 * @param id The ID of the ingredient to update.
 * @param updates The partial data containing the updates.
 * @returns A promise that resolves to the updated Ingredient object.
 */
export const updateIngredient = async (id: string, updates: UpdateIngredientDto): Promise<Ingredient> => {
  return apiFetch<Ingredient>(`${ingredientsApiUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
};

/**
 * Adds an alias to an existing ingredient via the backend API.
 * @param id The ID of the ingredient to update.
 * @param alias The alias string to add.
 * @returns A promise that resolves to the updated Ingredient object.
 */
export const addAliasToIngredient = async (id: string, alias: string): Promise<Ingredient> => {
    return apiFetch<Ingredient>(`${ingredientsApiUrl}/${id}/aliases`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias }),
    });
};

/**
 * Deletes an ingredient via the backend API.
 * @param id The ID of the ingredient to delete.
 * @returns A promise that resolves when the deletion is successful.
 */
export const deleteIngredient = async (id: string): Promise<void> => {
  const apiUrl = `${ingredientsApiUrl}/${id}`;
  try {
    const response = await authFetch(apiUrl, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      if (response.status === 409) {
        // Backend sends { message, details: { recipes: [...] } }
        const backendRecipes = errorData?.details?.recipes;
        const recipesList: RecipeDetails[] = Array.isArray(backendRecipes)
          ? backendRecipes.map((r: { _id: string; name: string }) => ({
              _id: r._id,
              name: r.name,
              ingredients: [],
              steps: [],
              type: 'ice cream recipe',
              baseYieldGrams: 0,
              linkedRecipes: [],
              productionLossPercent: 0,
            }))
          : [];
        const customError: IngredientInUseErrorType = {
          name: 'IngredientInUseError',
          message: errorData.message || 'Ingredient is in use by other recipes.',
          dependentRecipes: recipesList,
        };
        throw customError;
      }
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    // No content expected on successful DELETE, so return void
    return;
  } catch (error) {
    console.error(`Failed to delete ingredient with ID ${id}:`, error);
    // Re-throw the error to be caught by the calling function
    throw error;
  }
};
/**
 * Adds stock to an existing ingredient via the backend API.
 * @param ingredientId The ID of the ingredient to update.
 * @param quantityToAdd The amount of stock to add.
 * @returns A promise that resolves to the updated Ingredient object.
 */
export const addStockToIngredientApi = async (ingredientId: string, quantityToAdd: number): Promise<Ingredient> => {
  return apiFetch<Ingredient>(`${ingredientsApiUrl}/${ingredientId}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantityToAdd }),
  });
};

/**
 * Fetches recipes that depend on a specific ingredient.
 * @param ingredientId The ID of the ingredient.
 * @returns A promise that resolves to an array of RecipeDetails objects.
 */
export const getIngredientDependencies = async (ingredientId: string): Promise<RecipeDetails[]> => {
  return apiFetch<RecipeDetails[]>(`${ingredientsApiUrl}/${ingredientId}/dependencies`);
};

/**
 * Reset all ingredients' quantityInStock to 0.
 * @returns A promise resolving to { message, modifiedCount }.
 */
export const resetAllIngredientStockApi = async (): Promise<{ message: string; modifiedCount: number }> => {
  return apiFetch(`${ingredientsApiUrl}/reset-stock`, {
    method: 'POST',
  });
};

export interface BatchPurchaseInputItem {
  /** Existing ingredient ID — omit for new ingredients */
  ingredientId?: string;
  /** Required for new ingredients */
  name?: string;
  /** Optional aliases for new ingredients */
  aliases?: string[];
  /** Amount to add (grams) */
  quantityToAdd: number;
}

export interface BatchPurchaseResponse {
  ingredients: Ingredient[];
  count: number;
}

/**
 * Batch-add a purchase receipt.
 * Accepts a mix of existing ingredients (by ID) and new ones (by name+aliases).
 */
export const batchAddPurchaseApi = async (
  items: BatchPurchaseInputItem[],
): Promise<BatchPurchaseResponse> => {
  return apiFetch<BatchPurchaseResponse>(`${ingredientsApiUrl}/batch-purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
};