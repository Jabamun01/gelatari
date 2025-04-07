# Backend Step 16: Define and Mount Recipe Routes

## Task Description
Define the Express router for recipe-related API endpoints. Map the HTTP methods and URL paths (e.g., GET `/api/recipes`, POST `/api/recipes`, GET `/api/recipes/:id`) to the corresponding recipe controller handler functions. Mount this router in the main `src/server.ts` file under the `/api` base path.

## Files to Read
*   `src/controllers/recipeController.ts` (To import handler functions created in step 15)
*   `src/server.ts` (To mount the router and see existing middleware/routing setup, like ingredient routes mount)
*   `src/routes/ingredientRoutes.ts` (Example of existing router setup and structure)
*   `src/controllers/ingredientController.ts` (Context for how ingredient handlers were defined)
## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/routes/recipeRoutes.ts` file.
*   Content of `src/routes/recipeRoutes.ts` should include:
    *   Importing `Router` from `express`.
    *   Importing all handler functions from `../controllers/recipeController`.
    *   Creating an Express `Router` instance (`const router = Router();`).
    *   Defining routes:
        *   `router.post('/', createRecipeHandler);`
        *   `router.get('/', getAllRecipesHandler);` // Will handle query params like ?type=...&searchTerm=...
        *   `router.get('/:id', getRecipeByIdHandler);`
        *   `router.put('/:id', updateRecipeHandler);` // Or PATCH
        *   `router.delete('/:id', deleteRecipeHandler);`
    *   Exporting the `router`.
*   Modification of `src/server.ts`:
    *   Import the recipe router (e.g., `import recipeRoutes from './routes/recipeRoutes';`).
    *   Mount the router using `app.use('/api/recipes', recipeRoutes);` (place this alongside other route mounts).

## Manual Testing Note
After implementing, run the server (`pnpm ts-node src/server.ts`). Use `curl` or Postman/Insomnia to test the recipe endpoints thoroughly:
*   Create ingredients first (using ingredient endpoints).
*   `POST /api/recipes` with valid JSON for an "ice cream recipe" (including `category`, `ingredients` array with valid ingredient IDs and amounts, `steps`). Expect 201.
*   `POST /api/recipes` with valid JSON for a "not ice cream recipe". Expect 201.
*   `GET /api/recipes`. Expect 200 and an array of recipes with populated ingredient names/allergens.
*   `GET /api/recipes?type=ice%20cream%20recipe`. Expect 200 and only ice cream recipes.
*   `GET /api/recipes?searchTerm=Vanilla`. Expect 200 and recipes with "Vanilla" in the name.
*   `GET /api/recipes/<id>`. Expect 200 and the specific recipe, populated.
*   `PUT /api/recipes/<id>` with updated steps or ingredients. Expect 200 and the updated recipe.
*   `DELETE /api/recipes/<id>`. Expect 200.
*   `GET /api/recipes/<id>`. Expect 404.