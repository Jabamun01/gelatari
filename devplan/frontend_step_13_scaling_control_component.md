# Frontend Step 13: Implement Scaling Control Component

## Task Description
Create the `ScalingControl` component that allows the user to adjust the recipe's scale factor. This component should include a slider input with defined snap points (5kg, 10kg, 30kg relative to the 1kg base yield) and potentially a manual number input field for precise scaling. It will receive the current scale factor and a function to update it from its parent (`RecipeTab`).

## Files to Read
*   `frontend/src/components/recipe/RecipeTab.tsx` (To integrate the `ScalingControl` and manage state, modified step 11, 12)
*   `frontend/src/styles/global.ts` (For styling, created step 4)
*   `frontend/src/utils/formatting.ts` (If `formatAmount` was extracted previously, otherwise read from `IngredientList.tsx`)
*   `frontend/src/components/recipe/IngredientList.tsx` (Shows interaction with scaleFactor state, created step 11)
*   `frontend/src/types/recipe.ts` (To know about `baseYieldGrams`, created step 10)
## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of `frontend/src/components/recipe/ScalingControl.tsx`.
*   Content of `ScalingControl.tsx`:
    *   Import `React`.
    *   Import `styled` from `@linaria/react`.
    *   Define props interface: `{ scaleFactor: number; onScaleChange: (newScale: number) => void; baseYieldGrams: number; }`.
    *   Define styled components for the container, slider (`input type="range"`), number input (`input type="number"`), and labels/display text.
    *   Implement the `ScalingControl` component:
        *   Accepts `scaleFactor`, `onScaleChange`, `baseYieldGrams` props.
        *   Render a label indicating the current scaled yield (e.g., "Yield: {formatAmount(baseYieldGrams * scaleFactor)}"). Use the `formatAmount` helper (consider extracting it to `src/utils/formatting.ts` if used elsewhere).
        *   Render the slider input:
            *   Set `min`, `max` attributes appropriately (e.g., min=0.1, max=50, or based on practical limits).
            *   Set `step` attribute (e.g., 0.1).
            *   Set `value` to `scaleFactor`.
            *   Use `onChange` handler to call `onScaleChange(parseFloat(event.target.value))`.
            *   Consider adding a `list` attribute pointing to a `<datalist>` element with `<option>` tags for the snap points (5, 10, 30) to provide visual markers on the slider.
        *   Render the number input:
            *   Set `type="number"`, `min`, `max`, `step`.
            *   Set `value` to `scaleFactor`.
            *   Use `onChange` handler similar to the slider.
*   Modification of `frontend/src/components/recipe/RecipeTab.tsx`:
    *   Import the `ScalingControl` component.
    *   Import the `formatAmount` utility function (if extracted).
    *   Ensure the `scaleFactor` state and its setter (`setScaleFactor`) are defined using `useState`.
    *   Replace the "Scaling Control Area" placeholder with `<ScalingControl scaleFactor={scaleFactor} onScaleChange={setScaleFactor} baseYieldGrams={data.baseYieldGrams} />` (only render when `data` is available).

## Manual Testing Note
After implementing, restart the Vite dev server. Open a recipe tab.
*   Verify the scaling control section is displayed, showing the initial yield (based on scaleFactor=1 and the recipe's baseYieldGrams).
*   Interact with the slider. Check that the displayed yield updates and the ingredient amounts in the `IngredientList` update accordingly.
*   Interact with the number input. Check that the displayed yield and ingredient amounts update.
*   Verify the snap points on the slider (if implemented using datalist) are visible.
*   Ensure controls are styled appropriately. Check console for errors.