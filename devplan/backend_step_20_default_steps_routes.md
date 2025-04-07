# Backend Step 20: Define and Mount Default Steps Routes

## Task Description
Define the Express router for the default steps API endpoint. Map the HTTP GET method and URL path (including a category parameter) to the corresponding controller handler function. Mount this router in the main `src/server.ts` file.

## Files to Read
*   `src/controllers/defaultStepsController.ts` (To import the handler function being mapped, created in step 19)
*   `src/server.ts` (To mount the new router and see existing application setup and other routes)
*   `src/routes/ingredientRoutes.ts` (Example router setup pattern)
*   `src/routes/recipeRoutes.ts` (Another example router setup pattern, created in step 16)
## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/routes/defaultStepsRoutes.ts` file.
*   Content of `src/routes/defaultStepsRoutes.ts` should include:
    *   Importing `Router` from `express`.
    *   Importing `getDefaultStepsHandler` from `../controllers/defaultStepsController`.
    *   Creating an Express `Router` instance (`const router = Router();`).
    *   Defining the route:
        *   `router.get('/:category', getDefaultStepsHandler);`
    *   Exporting the `router`.
*   Modification of `src/server.ts`:
    *   Import the default steps router (e.g., `import defaultStepsRoutes from './routes/defaultStepsRoutes';`).
    *   Mount the router using `app.use('/api/default-steps', defaultStepsRoutes);` (place this alongside other route mounts).

## Manual Testing Note
After implementing and seeding data for 'ice cream' and 'sorbet' in the `defaultsteps` collection:
*   Run the server (`pnpm ts-node src/server.ts`).
*   Use `curl` or Postman/Insomnia to test:
    *   `GET /api/default-steps/ice%20cream` (URL encode space). Expect 200 and the ice cream steps array.
    *   `GET /api/default-steps/sorbet`. Expect 200 and the sorbet steps array.
    *   `GET /api/default-steps/pastry`. Expect 400 (invalid category).
    *   If data wasn't seeded for 'sorbet', `GET /api/default-steps/sorbet`. Expect 404.