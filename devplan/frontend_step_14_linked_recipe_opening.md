# Frontend Step 14: Handle Linked Recipe Opening and Scaling

## Task Description
Implement the functionality to open linked recipes (components) when clicked within a recipe's steps or description. Clicking a linked recipe should open it in a new, active tab, automatically scaled according to the amount specified in the parent recipe's `linkedRecipes` data. This requires modifying the tab state management and the component rendering the steps.

**Assumption:** For now, assume linked recipes are referenced within the `steps` array using a specific convention like `"Use 500g of [Linked Recipe Name]"`. The logic will need to find the corresponding `recipeId` and `amountGrams` from the `linkedRecipes` array passed down from `RecipeTab`. A more robust solution might involve structuring step data better in the backend/frontend types.

## Files to Read
*   `frontend/src/components/recipe/StepList.tsx` (To modify rendering and add click handlers, created step 12)
*   `frontend/src/components/recipe/RecipeTab.tsx` (To pass down `linkedRecipes` data and `handleOpenRecipeTab`, modified steps 11-13)
*   `frontend/src/App.tsx` (To modify `handleOpenRecipeTab` to accept scale factor, modified step 9)
*   `frontend/src/types/tabs.ts` (To add `initialScaleFactor` to `Tab` interface, created step 5, modified step 9)
*   `frontend/src/types/recipe.ts` (To reference `RecipeDetails` and `LinkedRecipeInfo`, created step 10)
*   `frontend/src/components/tabs/TabContent.tsx` (For context on how tabs are rendered)
## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Modification of `frontend/src/types/tabs.ts`:
    *   Add an optional `initialScaleFactor?: number;` property to the `Tab` interface.
*   Modification of `frontend/src/App.tsx`:
    *   Update the `handleOpenRecipeTab` function signature to accept an optional third argument: `initialScaleFactor?: number`.
    *   When creating a *new* `Tab` object inside `handleOpenRecipeTab`, include the `initialScaleFactor` if provided: `{ ..., isCloseable: true, initialScaleFactor }`.
*   Modification of `frontend/src/components/recipe/RecipeTab.tsx`:
    *   Find the corresponding `Tab` object for the current `recipeId` from the `tabs` array passed down from `App` (or manage tab state via Context later).
    *   Use the `tab.initialScaleFactor` (if present, otherwise default to 1) when initializing the `scaleFactor` state using `useState`: `useState(tab?.initialScaleFactor ?? 1);`.
    *   Pass the `data.linkedRecipes` array and the `handleOpenRecipeTab` function down to the `StepList` component.
*   Modification of `frontend/src/components/recipe/StepList.tsx`:
    *   Update props interface to accept `linkedRecipes: LinkedRecipeInfo[]` and `onOpenRecipeTab: (recipeId: string, recipeName: string, initialScaleFactor?: number) => void`.
    *   Modify the step rendering logic:
        *   For each step string, try to match patterns like `[Linked Recipe Name]`.
        *   If a match is found, find the corresponding entry in the `linkedRecipes` array by name (`linkedRecipe.recipe.name`).
        *   If found, render the matched text as a clickable element (e.g., styled button or link).
        *   The `onClick` handler should call `onOpenRecipeTab` with:
            *   `recipeId`: `linkedRecipe.recipe._id`
            *   `recipeName`: `linkedRecipe.recipe.name`
            *   `initialScaleFactor`: `linkedRecipe.amountGrams / 1000` (assuming the linked recipe's base yield is always 1000g).
        *   If no match or corresponding linked recipe data is found, render the step as plain text.

## Manual Testing Note
After implementing, restart the Vite dev server. Ensure the backend is running and you have recipes with `linkedRecipes` data correctly populated, and corresponding step text referencing them by name.
*   Open a recipe that links to another recipe component.
*   Verify the linked recipe name within the steps is clickable.
*   Click the linked recipe name.
*   Verify a new tab opens for the linked recipe and becomes active.
*   Verify (by checking the scaling control or ingredient amounts) that the newly opened linked recipe tab starts with a scale factor corresponding to the required amount (e.g., if step said "Use 500g of [Component]", the component tab should open scaled to 0.5).
*   Check console for errors.