# Backend Step 14: Implement Recipe Service

## Task Description
Create the service layer logic for managing recipes. This involves creating functions that interact with the `Recipe` Mongoose model to perform Create, Read (all, by ID, search), Update, and Delete (CRUD) operations. Implement logic to populate referenced ingredient and linked recipe data. Include basic error handling.

## Files to Read
*   `src/models/Recipe.ts` (To import the Recipe model and interface)
*   `src/models/Ingredient.ts` (To specify population fields for ingredients)

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/services/recipeService.ts` file.
*   Content of `src/services/recipeService.ts` should include:
    *   Importing the `Recipe` model and `IRecipe` interface from `../models/Recipe`.
    *   Exported asynchronous arrow functions for:
        *   `createRecipe(recipeData: Omit<IRecipe, '_id' | 'createdAt' | 'updatedAt'>): Promise<IRecipe>`: Creates and saves a new recipe. Validates input data structure implicitly via Mongoose schema.
        *   `getAllRecipes(filter?: { type?: string; searchTerm?: string }): Promise<IRecipe[]>`: Retrieves recipes.
            *   Includes filtering logic based on `type` ('ice cream recipe' or 'not ice cream recipe').
            *   Includes search logic based on `searchTerm` (case-insensitive match on `name`).
            *   Populates ingredient details: `populate('ingredients.ingredient', 'name isAllergen')`.
            *   Populates linked recipe details: `populate('linkedRecipes.recipe', 'name')`.
        *   `getRecipeById(id: string): Promise<IRecipe | null>`: Retrieves a single recipe by ID.
            *   Populates ingredient details: `populate('ingredients.ingredient', 'name isAllergen')`.
            *   Populates linked recipe details: `populate('linkedRecipes.recipe', 'name')`.
            *   Handles invalid ID format and not found cases.
        *   `updateRecipe(id: string, updates: Partial<IRecipe>): Promise<IRecipe | null>`: Updates a recipe by ID. Handles not found cases. Returns the *updated* document with populated fields.
        *   `deleteRecipe(id: string): Promise<IRecipe | null>`: Deletes a recipe by ID. Handles not found cases.
    *   Basic try/catch blocks within each function to handle potential Mongoose errors and return null or re-throw as appropriate.

## Manual Testing Note
After implementing, verify the file `src/services/recipeService.ts` exists and contains the described functions with population logic. Run `pnpm tsc` to check for compilation errors. Actual functionality testing requires controllers and routes (implemented in subsequent steps). Ensure the population paths and selected fields (`'name isAllergen'`, `'name'`) are correct.