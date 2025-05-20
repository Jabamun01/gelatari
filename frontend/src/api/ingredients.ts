import { Ingredient, CreateIngredientDto, UpdateIngredientDto } from '../types/ingredient';
import { RecipeDetails } from '../types/recipe';

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

// Define the base URL for the backend API using Vite's environment variables.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
    const url = new URL(ingredientsApiUrl);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    if (searchTerm && searchTerm.trim() !== '') { // Add searchTerm filter if provided
        url.searchParams.append('searchTerm', searchTerm.trim());
    }

    const response = await fetch(url.toString());

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
    const response = await fetch(apiUrl);

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
  try {
    const response = await fetch(ingredientsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ingredientData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const data: Ingredient = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to create ingredient:', error);
    throw error;
  }
};

/**
 * Updates an existing ingredient via the backend API.
 * @param id The ID of the ingredient to update.
 * @param updates The partial data containing the updates.
 * @returns A promise that resolves to the updated Ingredient object.
 */
export const updateIngredient = async (id: string, updates: UpdateIngredientDto): Promise<Ingredient> => {
  const apiUrl = `${ingredientsApiUrl}/${id}`;
  try {
    const response = await fetch(apiUrl, {
      method: 'PUT', // Or PATCH if the backend supports it for partial updates
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const data: Ingredient = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to update ingredient with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Adds an alias to an existing ingredient via the backend API.
 * @param id The ID of the ingredient to update.
 * @param alias The alias string to add.
 * @returns A promise that resolves to the updated Ingredient object.
 */
export const addAliasToIngredient = async (id: string, alias: string): Promise<Ingredient> => {
    const apiUrl = `${ingredientsApiUrl}/${id}/aliases`;
    try {
        const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ alias }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
            );
        }

        const data: Ingredient = await response.json();
        return data;
    } catch (error) {
        console.error(`Failed to add alias to ingredient with ID ${id}:`, error);
        throw error;
    }
};

/**
 * Deletes an ingredient via the backend API.
 * @param id The ID of the ingredient to delete.
 * @returns A promise that resolves when the deletion is successful.
 */
export const deleteIngredient = async (id: string): Promise<void> => {
  const apiUrl = `${ingredientsApiUrl}/${id}`;
  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      if (response.status === 409 && errorData.dependentRecipes && Array.isArray(errorData.dependentRecipes)) {
        // Assuming the backend sends { message: string, dependentRecipes: RecipeDetails[] }
        const customError: IngredientInUseErrorType = {
          name: 'IngredientInUseError',
          message: errorData.message || 'Ingredient is in use by other recipes.',
          dependentRecipes: errorData.dependentRecipes,
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
  const apiUrl = `${ingredientsApiUrl}/${ingredientId}/stock`;
  try {
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantityToAdd }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const data: Ingredient = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to add stock to ingredient with ID ${ingredientId}:`, error);
    throw error;
  }
};

/**
 * Fetches recipes that depend on a specific ingredient.
 * @param ingredientId The ID of the ingredient.
 * @returns A promise that resolves to an array of RecipeDetails objects.
 */
export const getIngredientDependencies = async (ingredientId: string): Promise<RecipeDetails[]> => {
  const apiUrl = `${ingredientsApiUrl}/${ingredientId}/dependencies`; // Assuming this endpoint exists
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || 'Failed to fetch dependencies'}`
      );
    }
    const dependentRecipes: RecipeDetails[] = await response.json();
    return dependentRecipes || []; // Or simply: return dependentRecipes; // Ensure it returns an array
  } catch (error) {
    console.error(`Failed to fetch dependencies for ingredient ID ${ingredientId}:`, error);
    throw error;
  }
};