Frontend Step 19: Create Ingredient API Functions and Types
Task Description

Create a dedicated API utility file (frontend/src/api/ingredients.ts) to handle communication with the backend's ingredient endpoints (/api/ingredients). Implement functions for fetching all ingredients, creating a new ingredient, updating an ingredient (specifically toggling the allergen status), and deleting an ingredient. Define corresponding TypeScript types/interfaces for ingredients on the frontend.
Files to Read

    frontend/src/api/recipes.ts (Example of existing API functions file structure, fetch usage, type definitions, created step 8, modified step 10)

    frontend/src/types/recipe.ts (Example of frontend type definitions, created step 10)

    frontend/package.json (To see dependencies like React, @tanstack/react-query)

    Backend Step 12 (devplan/backend_step_12_ingredient_routes.md) for backend endpoint definitions (GET /, POST /, PUT /:id, DELETE /:id)

    Backend Step 9 (devplan/backend_step_09_ingredient_model.md) for backend ingredient structure (name, isAllergen, _id)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend. Define types independently.

Deliverables

    Creation of frontend/src/types/ingredient.ts:

          
    export interface Ingredient {
      _id: string; // Or id
      name: string;
      isAllergen: boolean;
    }

    export interface CreateIngredientDto {
        name: string;
        isAllergen: boolean;
    }

    export interface UpdateIngredientDto {
        // Define only fields that can be updated by the frontend
        isAllergen?: boolean; // Allow toggling allergen status
        // Add name? Be cautious if used in recipes - maybe omit for now
        // name?: string;
    }

        

    Creation of frontend/src/api/ingredients.ts:

        Import types from ../types/ingredient.

        Implement getAllIngredients = async (): Promise<Ingredient[]> => { ... }:

            Makes a GET request to /api/ingredients.

            Handles errors and returns parsed JSON array.

        Implement createIngredient = async (ingredientData: CreateIngredientDto): Promise<Ingredient> => { ... }:

            Makes a POST request to /api/ingredients with ingredientData in the body.

            Sets Content-Type: application/json header.

            Handles errors and returns the created ingredient.

        Implement updateIngredient = async (id: string, updates: UpdateIngredientDto): Promise<Ingredient> => { ... }:

            Makes a PUT request to /api/ingredients/${id} with updates in the body.

            Sets Content-Type: application/json header.

            Handles errors and returns the updated ingredient.

        Implement deleteIngredient = async (id: string): Promise<void> => { ... }: // Or return the deleted item if preferred

            Makes a DELETE request to /api/ingredients/${id}.

            Handles errors (especially 404 Not Found). Returns void or the deleted item on success.

Manual Testing Note

After implementing, this step primarily creates utility functions and types.

    Verify the files frontend/src/types/ingredient.ts and frontend/src/api/ingredients.ts exist and contain the specified content.

    Run pnpm tsc --noEmit within the frontend directory to check for TypeScript compilation errors in the new files.

    Direct testing requires using these functions within components in subsequent steps.