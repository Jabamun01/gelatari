# Frontend Step 16: Implement Production Mode Ingredient Tracking

## Task Description
Modify the `IngredientList` component (or create a specialized `ProductionIngredientList`) to support tracking the amount of each ingredient added when Production Mode is active in the parent `RecipeTab`. Display the target scaled amount and provide an input/button to record the amount added. Store this "added amount" state within the `RecipeTab`.

## Files to Read
*   `frontend/src/components/recipe/RecipeTab.tsx` (To manage tracking state and pass props)
*   `frontend/src/components/recipe/IngredientList.tsx` (To modify or use as base)
*   `frontend/src/types/recipe.ts` (To reference `RecipeIngredient`)
*   `frontend/src/styles/global.ts` (For styling)

## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Definition of a state structure in `RecipeTab` to hold tracked amounts. A simple object mapping ingredient ID to the added amount (in grams) is suitable: `Record<string, number>`.
*   Modification of `frontend/src/components/recipe/RecipeTab.tsx`:
    *   Add state for tracked amounts: `const [trackedAmounts, setTrackedAmounts] = useState<Record<string, number>>({});`.
    *   Define a handler function `handleAmountTracked = (ingredientId: string, addedAmountGrams: number) => { ... }` that updates the `trackedAmounts` state: `setTrackedAmounts(prev => ({ ...prev, [ingredientId]: addedAmountGrams }));`.
    *   Pass `isProductionMode`, `trackedAmounts`, and `handleAmountTracked` down to the `IngredientList` component.
    *   Reset `trackedAmounts` to `{}` when `isProductionMode` is toggled off (optional, depends on desired behavior).
*   Modification of `frontend/src/components/recipe/IngredientList.tsx`:
    *   Update props interface to accept `isProductionMode: boolean`, `trackedAmounts: Record<string, number>`, `onAmountTracked: (ingredientId: string, addedAmountGrams: number) => void`.
    *   Modify the rendering logic for each ingredient item (`<li>`):
        *   Always display the target scaled amount (e.g., ` / {formatAmount(scaledAmount)}`).
        *   If `isProductionMode` is true:
            *   Retrieve the currently tracked amount for this ingredient: `const currentTracked = trackedAmounts[ingredient.ingredient._id] ?? 0;`.
            *   Display the tracked amount (e.g., `{formatAmount(currentTracked)} added`).
            *   Add an input field (`type="number"`) or buttons (+/-) next to the ingredient.
            *   The input's value should be the `currentTracked` amount (or allow entering a new value).
            *   The input's `onChange` or button `onClick` handlers should call `onAmountTracked(ingredient.ingredient._id, newAmountInGrams)`. Ensure the value passed is numeric.
        *   If `isProductionMode` is false, hide the tracking input/buttons and the "added" text.

## Manual Testing Note
After implementing, restart the Vite dev server. Open a recipe tab.
*   Toggle Production Mode ON.
*   Verify that each ingredient now shows the target amount (e.g., " / 1.2kg") and an input field/buttons for tracking, initially showing "0g added".
*   Enter a value into the input for an ingredient (e.g., 500). Verify the display updates to "500g added / 1.2kg".
*   Use React DevTools to inspect `RecipeTab` state and confirm `trackedAmounts` is updated correctly.
*   Track amounts for multiple ingredients.
*   Toggle Production Mode OFF. Verify the tracking inputs/text disappear.
*   Toggle Production Mode ON again. Verify the previously tracked amounts are still displayed (unless reset logic was added).
*   Check styling and console for errors.