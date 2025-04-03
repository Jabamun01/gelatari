# Backend Broad Development Plan: Ice Cream Recipe Workshop App

This document outlines the major phases for developing the backend of the Ice Cream Recipe Workshop application. Each phase will be broken down into granular, self-contained steps suitable for stateless AI coding agents.

## Phase 1: Project Setup & Core Infrastructure
*   **Goal:** Establish the basic project structure, dependencies, and database connection.
*   **Steps:**
    *   Initialize Node.js project using PNPM and TypeScript.
    *   Install core dependencies: Express, Mongoose, TypeScript, ts-node, nodemon, etc.
    *   Set up the standard Express.js project structure (e.g., `src/`, `src/config/`, `src/routes/`, `src/controllers/`, `src/services/`, `src/models/`, `src/utils/`).
    *   Configure `tsconfig.json` for compilation.
    *   Create a basic Express server entry point (`src/server.ts`).
    *   Implement MongoDB connection logic using Mongoose within the config or a dedicated utility.
    *   Set up basic environment variable handling (e.g., for DB connection string, port).
    *   Add basic middleware (e.g., JSON body parser, CORS).

## Phase 2: Ingredient Management
*   **Goal:** Implement CRUD operations for ingredients, including the allergen flag.
*   **Steps:**
    *   Define the Ingredient Mongoose schema (`src/models/Ingredient.ts`) with `name` (String, unique, required) and `isAllergen` (Boolean, default: false).
    *   Implement Ingredient service (`src/services/ingredientService.ts`) for CRUD logic (create, getAll, getById, update, delete).
    *   Implement Ingredient controller (`src/controllers/ingredientController.ts`) to handle HTTP requests and responses, using the service. Include input validation.
    *   Define Ingredient routes (`src/routes/ingredientRoutes.ts`) and mount them in the main server file.
    *   Implement robust error handling for database operations and validation.

## Phase 3: Recipe Core Management
*   **Goal:** Implement CRUD operations for recipes, including types, categories, ingredients, steps, and base yield.
*   **Steps:**
    *   Define the Recipe Mongoose schema (`src/models/Recipe.ts`):
        *   `name`: String, required
        *   `type`: String, enum ['ice cream recipe', 'not ice cream recipe'], required
        *   `category`: String, enum ['ice cream', 'sorbet'], optional (only if type is 'ice cream recipe')
        *   `ingredients`: Array of objects [{ `ingredient`: ObjectId (ref: 'Ingredient'), `amountGrams`: Number }], required
        *   `steps`: Array of Strings, required
        *   `baseYieldGrams`: Number, default: 1000, required
        *   `linkedRecipes`: Array of objects [{ `recipe`: ObjectId (ref: 'Recipe'), `amountGrams`: Number }] (For linking non-ice cream components)
    *   Implement Recipe service (`src/services/recipeService.ts`) for CRUD logic. Handle population of ingredient details and linked recipe names/IDs.
    *   Implement Recipe controller (`src/controllers/recipeController.ts`) with input validation.
    *   Define Recipe routes (`src/routes/recipeRoutes.ts`).
    *   Implement search functionality (live search based on name, filtering by type).
    *   Implement error handling.

## Phase 4: Default Steps Management
*   **Goal:** Store and retrieve default step lists for "ice cream" and "sorbet" categories.
*   **Steps:**
    *   Define a simple schema/model for Default Steps (`src/models/DefaultSteps.ts`), perhaps storing category ('ice cream'/'sorbet') and the steps array. Alternatively, use a configuration file or a simple collection.
    *   Implement service (`src/services/defaultStepsService.ts`) to get steps by category.
    *   Implement controller (`src/controllers/defaultStepsController.ts`) and routes (`src/routes/defaultStepsRoutes.ts`) to expose an endpoint for fetching default steps.
    *   (Optional) Implement endpoints to manage/update default steps if needed, otherwise they might be seeded manually.

## Phase 5: API Refinement & Finalization
*   **Goal:** Review all endpoints, ensure consistency, add final touches like comprehensive API documentation (e.g., using Swagger/OpenAPI if desired, though not strictly required by prompt), and final testing.
*   **Steps:**
    *   Review all API endpoints for consistency in request/response formats.
    *   Ensure proper HTTP status codes are used.
    *   Refine error handling and validation messages.
    *   Add any necessary utility functions (`src/utils/`).
    *   Perform integration testing of all endpoints.