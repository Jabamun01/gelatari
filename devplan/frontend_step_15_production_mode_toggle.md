# Frontend Step 15: Add Production Mode Toggle

## Task Description
Add a toggle button or switch to the `RecipeTab` component to enable/disable "Production Mode" for the currently viewed recipe. Manage the state of this toggle locally within the `RecipeTab` component using `useState`.

## Files to Read
*   `frontend/src/components/recipe/RecipeTab.tsx` (To modify, add state and button, modified steps 11-14)
*   `frontend/src/styles/global.ts` (For styling, created step 4)
*   `frontend/src/components/recipe/ScalingControl.tsx` (Example of another control element within RecipeTab, created step 13)
## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Modification of `frontend/src/components/recipe/RecipeTab.tsx`:
    *   Add a new state variable using `useState` to track whether production mode is active: `const [isProductionMode, setIsProductionMode] = useState(false);`.
    *   Add a styled button or toggle switch element (using Linaria) somewhere prominent within the recipe view (e.g., near the recipe title or scaling controls).
    *   The button's text or the switch's state should reflect the value of `isProductionMode`.
    *   Add an `onClick` handler to the button/switch that toggles the `isProductionMode` state (`setIsProductionMode(prev => !prev);`).
    *   Conditionally render elements or apply styles based on `isProductionMode` later (e.g., show/hide timer, change ingredient list appearance). For now, just ensure the toggle itself works and updates state.

## Manual Testing Note
After implementing, restart the Vite dev server. Open a recipe tab.
*   Verify the "Production Mode" toggle button/switch is visible.
*   Click the toggle. Verify its visual state changes (e.g., button text changes, switch moves).
*   Use React DevTools to inspect the `RecipeTab` component's state and confirm that the `isProductionMode` state variable updates correctly when the toggle is clicked.
*   Ensure the toggle is styled appropriately. Check console for errors.