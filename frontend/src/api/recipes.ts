import { RecipeDetails, CreateRecipeDto, UpdateRecipeDto } from '../types/recipe'; // Import the new types

// Define the type for the recipe search results
export interface RecipeSearchResult {
  _id: string; // Expect _id from MongoDB
  name: string;
  // Add other relevant fields if the backend provides them and they are needed
}

// Define the possible type filters
export type RecipeTypeFilter = 'ice cream recipe' | 'not ice cream recipe';

/**
 * Fetches recipes from the backend API based on search term and optional type filter.
 * @param searchTerm The term to search for in recipe names or descriptions.
 * @param typeFilter Optional filter to restrict results by type.
 * @returns A promise that resolves to an array of RecipeSearchResult.
 */
export const fetchRecipes = async (
  searchTerm: string,
  typeFilter?: RecipeTypeFilter
): Promise<RecipeSearchResult[]> => {
  // Ensure the backend base URL is correct. Adjust if necessary.
  const backendBaseUrl = 'http://localhost:3001';
  const apiUrl = new URL(`${backendBaseUrl}/api/recipes`);

  // Add search term query parameter
  apiUrl.searchParams.append('searchTerm', searchTerm);

  // Add type filter query parameter if provided
  if (typeFilter) {
    apiUrl.searchParams.append('type', typeFilter);
  }

  try {
    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      // Attempt to read error message from backend if available
      const errorData = await response.json().catch(() => ({})); // Gracefully handle non-JSON error responses
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const data: RecipeSearchResult[] = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    // Re-throw the error so react-query can handle it
    throw error;
  }
};

/**
 * Fetches all recipes from the backend API (basic info).
 * Assumes the backend endpoint /api/recipes returns all recipes when no search term is provided.
 * @returns A promise that resolves to an array of RecipeSearchResult.
 */
export const getAllRecipes = async (): Promise<RecipeSearchResult[]> => {
  const backendBaseUrl = 'http://localhost:3001';
  const apiUrl = `${backendBaseUrl}/api/recipes`; // Endpoint for all recipes

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const data: RecipeSearchResult[] = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch all recipes:', error);
    throw error;
  }
};


/**
 * Fetches a single recipe's details from the backend API by its ID.
 * @param recipeId The ID of the recipe to fetch.
 * @returns A promise that resolves to the RecipeDetails.
 */
export const fetchRecipeById = async (recipeId: string): Promise<RecipeDetails> => {
  // Ensure the backend base URL is correct. Adjust if necessary.
  const backendBaseUrl = 'http://localhost:3001'; // Make sure this matches your backend setup
  const apiUrl = `${backendBaseUrl}/api/recipes/${recipeId}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      // Attempt to read error message from backend if available
      const errorData = await response.json().catch(() => ({})); // Gracefully handle non-JSON error responses
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const data: RecipeDetails = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch recipe with ID ${recipeId}:`, error);
    // Re-throw the error so react-query can handle it
    throw error;
  }
};

/**
 * Creates a new recipe via the backend API.
 * @param recipeData The data for the new recipe.
 * @returns A promise that resolves to the created RecipeDetails.
 */
export const createRecipe = async (recipeData: CreateRecipeDto): Promise<RecipeDetails> => {
  const backendBaseUrl = 'http://localhost:3001';
  const apiUrl = `${backendBaseUrl}/api/recipes`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipeData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const createdRecipe: RecipeDetails = await response.json();
    return createdRecipe;
  } catch (error) {
    console.error('Failed to create recipe:', error);
    throw error;
  }
};

/**
 * Updates an existing recipe via the backend API.
 * @param id The ID of the recipe to update.
 * @param recipeData The data to update the recipe with.
 * @returns A promise that resolves to the updated RecipeDetails.
 */
export const updateRecipe = async (id: string, recipeData: UpdateRecipeDto): Promise<RecipeDetails> => {
  const backendBaseUrl = 'http://localhost:3001';
  const apiUrl = `${backendBaseUrl}/api/recipes/${id}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipeData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    const updatedRecipe: RecipeDetails = await response.json();
    return updatedRecipe;
  } catch (error) {
    console.error(`Failed to update recipe with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a recipe via the backend API.
 * @param id The ID of the recipe to delete.
 * @returns A promise that resolves when the deletion is successful.
 */
export const deleteRecipe = async (id: string): Promise<void> => {
  const backendBaseUrl = 'http://localhost:3001';
  const apiUrl = `${backendBaseUrl}/api/recipes/${id}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
    });

    if (!response.ok) {
      // Handle specific errors like 404 Not Found or 400 Bad Request (e.g., recipe in use)
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    // DELETE requests often return 204 No Content on success
    return; // Indicate success

  } catch (error) {
    console.error(`Failed to delete recipe with ID ${id}:`, error);
    throw error; // Re-throw for react-query
  }
};