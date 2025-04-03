# Backend Step 10: Implement Ingredient Service

## Task Description
Create the service layer logic for managing ingredients. This involves creating functions that interact with the `Ingredient` Mongoose model to perform Create, Read (all and by ID), Update, and Delete (CRUD) operations. Implement basic error handling for database interactions.

## Files to Read
*   `src/models/Ingredient.ts` (To import the model and interface)

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/services/ingredientService.ts` file.
*   Content of `src/services/ingredientService.ts` should include:
    *   Importing the `Ingredient` model and `IIngredient` interface from `../models/Ingredient`.
    *   Exported asynchronous arrow functions for:
        *   `createIngredient(name: string, isAllergen: boolean): Promise<IIngredient>`: Creates and saves a new ingredient. Handles potential duplicate name errors.
        *   `getAllIngredients(): Promise<IIngredient[]>`: Retrieves all ingredients.
        *   `getIngredientById(id: string): Promise<IIngredient | null>`: Retrieves a single ingredient by its ID. Handles invalid ID format and not found cases.
        *   `updateIngredient(id: string, updates: { name?: string; isAllergen?: boolean }): Promise<IIngredient | null>`: Updates an ingredient by ID. Handles not found cases.
        *   `deleteIngredient(id: string): Promise<IIngredient | null>`: Deletes an ingredient by ID. Handles not found cases.
    *   Basic try/catch blocks within each function to handle potential Mongoose errors (e.g., validation errors, cast errors, duplicate key errors) and re-throw or return null/appropriate values.

## Manual Testing Note
After implementing, verify the file `src/services/ingredientService.ts` exists and contains the described functions. Run `pnpm tsc` to check for compilation errors. Actual functionality testing requires controllers and routes (implemented in subsequent steps) or dedicated unit/integration tests.