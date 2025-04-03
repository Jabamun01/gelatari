# Backend Step 12: Define and Mount Ingredient Routes

## Task Description
Define the Express router for ingredient-related API endpoints. Map the HTTP methods and URL paths (e.g., GET `/api/ingredients`, POST `/api/ingredients`, GET `/api/ingredients/:id`) to the corresponding controller handler functions created in the previous step. Finally, mount this router in the main `src/server.ts` file under a base path (e.g., `/api`).

## Files to Read
*   `src/controllers/ingredientController.ts` (To import handler functions)
*   `src/server.ts` (To mount the router)

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/routes/ingredientRoutes.ts` file.
*   Content of `src/routes/ingredientRoutes.ts` should include:
    *   Importing `Router` from `express`.
    *   Importing all handler functions from `../controllers/ingredientController`.
    *   Creating an Express `Router` instance (`const router = Router();`).
    *   Defining routes:
        *   `router.post('/', createIngredientHandler);`
        *   `router.get('/', getAllIngredientsHandler);`
        *   `router.get('/:id', getIngredientByIdHandler);`
        *   `router.put('/:id', updateIngredientHandler);` // Or PATCH
        *   `router.delete('/:id', deleteIngredientHandler);`
    *   Exporting the `router`.
*   Modification of `src/server.ts`:
    *   Import the ingredient router (e.g., `import ingredientRoutes from './routes/ingredientRoutes';`).
    *   Mount the router using `app.use('/api/ingredients', ingredientRoutes);` (place this *after* middleware and *before* `app.listen`).

## Manual Testing Note
After implementing, run the server (`pnpm ts-node src/server.ts`). Use a tool like `curl` or Postman/Insomnia to test the defined endpoints:
*   `POST /api/ingredients` with a JSON body like `{"name": "Milk", "isAllergen": true}`. Expect 201.
*   `POST /api/ingredients` again with the same name. Expect 400/500 (duplicate error).
*   `GET /api/ingredients`. Expect 200 and an array containing "Milk".
*   `GET /api/ingredients/<id_of_milk>`. Expect 200 and the Milk ingredient object.
*   `PUT /api/ingredients/<id_of_milk>` with `{"isAllergen": false}`. Expect 200 and updated object.
*   `DELETE /api/ingredients/<id_of_milk>`. Expect 200.
*   `GET /api/ingredients/<id_of_milk>`. Expect 404.