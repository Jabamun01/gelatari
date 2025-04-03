# Backend Step 9: Define Ingredient Mongoose Schema and Model

## Task Description
Define the Mongoose schema and create the corresponding model for ingredients. This model will represent the structure of ingredient documents stored in the MongoDB database. Create a TypeScript interface representing the Ingredient document structure.

## Files to Read
*   None (Creating a new file).

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/models/Ingredient.ts` file.
*   Content of `src/models/Ingredient.ts` should include:
    *   Importing `Schema`, `model`, and `Document` from `mongoose`.
    *   Defining a TypeScript interface `IIngredient` extending `Document` with properties:
        *   `name`: `string`
        *   `isAllergen`: `boolean`
    *   Defining a Mongoose `Schema` instance (`ingredientSchema`) based on the interface:
        *   `name`: `{ type: String, required: true, unique: true, trim: true }`
        *   `isAllergen`: `{ type: Boolean, default: false }`
    *   Creating and exporting the Mongoose model using `model<IIngredient>('Ingredient', ingredientSchema)`.

## Manual Testing Note
After implementing, verify that the file `src/models/Ingredient.ts` exists and contains the Mongoose schema, TypeScript interface, and model export as described. Run `pnpm tsc` to check for any TypeScript compilation errors in the new file.