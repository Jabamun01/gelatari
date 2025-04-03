# Backend Step 11: Implement Ingredient Controller

## Task Description
Create the controller layer for handling HTTP requests related to ingredients. This involves creating functions that parse request data (body, params), call the appropriate `ingredientService` functions, and formulate the HTTP response (status codes, JSON data, error messages). Include basic input validation.

## Files to Read
*   `src/services/ingredientService.ts` (To import service functions)
*   `src/models/Ingredient.ts` (Potentially for type information if needed, though service should handle model interaction)

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/controllers/ingredientController.ts` file.
*   Content of `src/controllers/ingredientController.ts` should include:
    *   Importing `Request`, `Response` from `express`.
    *   Importing all functions from `../services/ingredientService`.
    *   Exported asynchronous arrow functions for:
        *   `createIngredientHandler(req: Request, res: Response)`:
            *   Extracts `name` and `isAllergen` from `req.body`.
            *   Validates input (e.g., `name` is present). Sends 400 if invalid.
            *   Calls `createIngredient` service function.
            *   Sends 201 response with the created ingredient or 500/400 on error (e.g., duplicate name).
        *   `getAllIngredientsHandler(req: Request, res: Response)`:
            *   Calls `getAllIngredients` service function.
            *   Sends 200 response with the array of ingredients or 500 on error.
        *   `getIngredientByIdHandler(req: Request, res: Response)`:
            *   Extracts `id` from `req.params`.
            *   Calls `getIngredientById` service function.
            *   Sends 200 response with the ingredient if found, 404 if not found, or 500 on error.
        *   `updateIngredientHandler(req: Request, res: Response)`:
            *   Extracts `id` from `req.params` and `updates` from `req.body`.
            *   Validates input (e.g., `updates` object is not empty). Sends 400 if invalid.
            *   Calls `updateIngredient` service function.
            *   Sends 200 response with the updated ingredient if found, 404 if not found, or 500 on error.
        *   `deleteIngredientHandler(req: Request, res: Response)`:
            *   Extracts `id` from `req.params`.
            *   Calls `deleteIngredient` service function.
            *   Sends 200 response with the deleted ingredient if found (or a success message), 404 if not found, or 500 on error.
    *   Use try/catch blocks within handlers to catch errors from the service layer and send appropriate error responses (e.g., `res.status(500).json({ message: 'Internal server error' })`).

## Manual Testing Note
After implementing, verify the file `src/controllers/ingredientController.ts` exists and contains the described handler functions. Run `pnpm tsc` to check for compilation errors. Testing the actual request handling requires defining routes and mounting them in the Express app (next step).