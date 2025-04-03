# Backend Step 15: Implement Recipe Controller

## Task Description
Create the controller layer for handling HTTP requests related to recipes. This involves creating functions that parse request data (body, params, query), call the appropriate `recipeService` functions, handle query parameters for filtering and searching, and formulate the HTTP response. Include basic input validation.

## Files to Read
*   `src/services/recipeService.ts` (To import service functions)
*   `src/models/Recipe.ts` (For type information, e.g., `IRecipe`)

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/controllers/recipeController.ts` file.
*   Content of `src/controllers/recipeController.ts` should include:
    *   Importing `Request`, `Response` from `express`.
    *   Importing all functions from `../services/recipeService`.
    *   Importing `IRecipe` from `../models/Recipe`.
    *   Exported asynchronous arrow functions for:
        *   `createRecipeHandler(req: Request, res: Response)`:
            *   Extracts recipe data from `req.body`.
            *   Performs basic validation (e.g., required fields like `name`, `type`, `ingredients`, `steps`). Sends 400 if invalid. Validate `category` based on `type`.
            *   Calls `createRecipe` service function.
            *   Sends 201 response with the created recipe or 500/400 on error.
        *   `getAllRecipesHandler(req: Request, res: Response)`:
            *   Extracts optional query parameters: `type` and `searchTerm` from `req.query`.
            *   Constructs a filter object based on query parameters.
            *   Calls `getAllRecipes` service function with the filter.
            *   Sends 200 response with the array of recipes or 500 on error.
        *   `getRecipeByIdHandler(req: Request, res: Response)`:
            *   Extracts `id` from `req.params`.
            *   Calls `getRecipeById` service function.
            *   Sends 200 response with the recipe if found, 404 if not found, or 500 on error.
        *   `updateRecipeHandler(req: Request, res: Response)`:
            *   Extracts `id` from `req.params` and `updates` from `req.body`.
            *   Validates input (e.g., `updates` object is not empty). Sends 400 if invalid.
            *   Calls `updateRecipe` service function.
            *   Sends 200 response with the updated recipe if found, 404 if not found, or 500 on error.
        *   `deleteRecipeHandler(req: Request, res: Response)`:
            *   Extracts `id` from `req.params`.
            *   Calls `deleteRecipe` service function.
            *   Sends 200 response with the deleted recipe (or a success message) if found, 404 if not found, or 500 on error.
    *   Use try/catch blocks for robust error handling, sending appropriate status codes (400, 404, 500).

## Manual Testing Note
After implementing, verify the file `src/controllers/recipeController.ts` exists and contains the described handler functions. Run `pnpm tsc` to check for compilation errors. Testing requires defining and mounting routes (next step). Pay attention to how query parameters (`type`, `searchTerm`) are handled in `getAllRecipesHandler`.