# Backend Step 13: Define Recipe Mongoose Schema and Model

## Task Description
Define the Mongoose schema and create the corresponding model for recipes. This model will represent the structure of recipe documents stored in MongoDB, including fields for name, type, category, ingredients (with amounts), steps, base yield, and linked recipes (components). Create a TypeScript interface representing the Recipe document structure.

## Files to Read
*   `src/models/Ingredient.ts` (To reference the Ingredient model/ObjectId)

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/models/Recipe.ts` file.
*   Content of `src/models/Recipe.ts` should include:
    *   Importing `Schema`, `model`, `Document`, `Types` from `mongoose`.
    *   Importing `IIngredient` (optional, for type safety in references if needed, though `Types.ObjectId` is standard).
    *   Defining a TypeScript interface `IRecipeIngredient` for the subdocument:
        *   `ingredient`: `Types.ObjectId` (or `IIngredient['_id']`)
        *   `amountGrams`: `number`
    *   Defining a TypeScript interface `ILinkedRecipe` for the subdocument:
        *   `recipe`: `Types.ObjectId` (or `IRecipe['_id']`) // Reference to self
        *   `amountGrams`: `number`
    *   Defining the main TypeScript interface `IRecipe` extending `Document`:
        *   `name`: `string`
        *   `type`: `'ice cream recipe' | 'not ice cream recipe'`
        *   `category?`: `'ice cream' | 'sorbet'` // Optional
        *   `ingredients`: `IRecipeIngredient[]`
        *   `steps`: `string[]`
        *   `baseYieldGrams`: `number`
        *   `linkedRecipes`: `ILinkedRecipe[]`
    *   Defining the Mongoose `Schema` instance (`recipeSchema`) based on the interface:
        *   `name`: `{ type: String, required: true, trim: true }`
        *   `type`: `{ type: String, enum: ['ice cream recipe', 'not ice cream recipe'], required: true }`
        *   `category`: `{ type: String, enum: ['ice cream', 'sorbet'], required: function(this: IRecipe) { return this.type === 'ice cream recipe'; } }` // Conditional requirement
        *   `ingredients`: `[{ ingredient: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true }, amountGrams: { type: Number, required: true, min: 0 } }]`
        *   `steps`: `[{ type: String, required: true }]`
        *   `baseYieldGrams`: `{ type: Number, default: 1000, required: true, min: 1 }`
        *   `linkedRecipes`: `[{ recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true }, amountGrams: { type: Number, required: true, min: 0 } }]`
    *   Creating and exporting the Mongoose model using `model<IRecipe>('Recipe', recipeSchema)`.

## Manual Testing Note
After implementing, verify that the file `src/models/Recipe.ts` exists and contains the Mongoose schema, TypeScript interfaces, and model export as described. Pay close attention to the `ref` properties and the conditional requirement for `category`. Run `pnpm tsc` to check for any TypeScript compilation errors.