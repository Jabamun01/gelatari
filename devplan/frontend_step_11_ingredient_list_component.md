# Frontend Step 11: Implement Ingredient List Component

## Task Description
Create the `IngredientList` component responsible for displaying the list of ingredients for a recipe. This component will receive the ingredients array (from the fetched `RecipeDetails`) and the current scaling factor (initially 1, controlled by a parent component later) as props. It should display the ingredient name, the scaled amount (formatted as X.Ykg or Zg), and visually highlight allergens.

## Files to Read
*   `frontend/src/components/recipe/RecipeTab.tsx` (To integrate the `IngredientList`)
*   `frontend/src/types/recipe.ts` (To reference `RecipeIngredient` type)
*   `frontend/src/styles/global.ts` (To use CSS variables, especially `--allergen-highlight-color`)

## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of `frontend/src/components/recipe/IngredientList.tsx`.
*   Content of `IngredientList.tsx`:
    *   Import `React`.
    *   Import `styled` from `@linaria/react`.
    *   Import the `RecipeIngredient` type from `../../types/recipe`.
    *   Define props interface: `{ ingredients: RecipeIngredient[]; scaleFactor: number; }`.
    *   Implement a helper function `formatAmount(grams: number): string` that takes grams and returns "X.Ykg" if >= 1000, otherwise "Zg". Handle potential floating point inaccuracies if needed (e.g., `toFixed(1)` for kg).
    *   Define styled components using Linaria for the list (`ul`), list items (`li`), ingredient name (`span`), amount (`span`), and potentially a wrapper span for allergens.
    *   Implement the `IngredientList` component:
        *   Accepts `ingredients` and `scaleFactor` props.
        *   Maps over the `ingredients` array.
        *   For each ingredient, calculate the scaled amount (`ingredient.amountGrams * scaleFactor`).
        *   Render a styled list item (`<li>`).
        *   Inside the `<li>`, render the ingredient name (`ingredient.ingredient.name`). Apply specific styling (e.g., using `var(--allergen-highlight-color)`) if `ingredient.ingredient.isAllergen` is true.
        *   Render the formatted scaled amount using the `formatAmount` helper function.
*   Modification of `frontend/src/components/recipe/RecipeTab.tsx`:
    *   Import the `IngredientList` component.
    *   Add a `useState` hook to manage the `scaleFactor`, initializing it to `1`.
    *   Replace the "Ingredient List Area" placeholder with `<IngredientList ingredients={data.ingredients} scaleFactor={scaleFactor} />` (only render when `data` is available).

## Manual Testing Note
After implementing, restart the Vite dev server. Open a recipe tab.
*   Verify the ingredient list is displayed below the recipe name/type.
*   Check that ingredient amounts are shown in grams (e.g., "500g") or kilograms (e.g., "1.2kg") based on the base amount (scale factor is 1 initially).
*   Verify that ingredients marked as allergens in the backend data are visually distinct (e.g., different color, bold text).
*   Ensure the list is styled appropriately. Check console for errors.