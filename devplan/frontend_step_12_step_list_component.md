# Frontend Step 12: Implement Step List Component

## Task Description
Create the `StepList` component responsible for displaying the sequence of recipe steps. This component receives the steps array (strings) from the fetched `RecipeDetails` as a prop. It should display the steps as an ordered list.

## Files to Read
*   `frontend/src/components/recipe/RecipeTab.tsx` (To integrate the `StepList`)
*   `frontend/src/types/recipe.ts` (To reference `RecipeDetails` type, specifically the `steps` array)
*   `frontend/src/styles/global.ts` (For styling consistency)

## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of `frontend/src/components/recipe/StepList.tsx`.
*   Content of `StepList.tsx`:
    *   Import `React`.
    *   Import `styled` from `@linaria/react`.
    *   Define props interface: `{ steps: string[]; }`.
    *   Define styled components using Linaria for the ordered list (`ol`) and list items (`li`). Use CSS variables for styling.
    *   Implement the `StepList` component:
        *   Accepts `steps` array prop.
        *   Renders a styled ordered list (`<ol>`).
        *   Maps over the `steps` array.
        *   For each step string, render a styled list item (`<li>`) containing the step text. Use the index as the key for the map.
*   Modification of `frontend/src/components/recipe/RecipeTab.tsx`:
    *   Import the `StepList` component.
    *   Replace the "Steps Area" placeholder with `<StepList steps={data.steps} />` (only render when `data` is available).

## Manual Testing Note
After implementing, restart the Vite dev server. Open a recipe tab.
*   Verify the list of steps is displayed below the ingredient list (or wherever placed in `RecipeTab`).
*   Check that the steps are numbered correctly (as it's an ordered list `<ol>`).
*   Ensure the list is styled appropriately according to the Linaria styles defined. Check console for errors.