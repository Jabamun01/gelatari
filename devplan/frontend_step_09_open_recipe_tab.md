# Frontend Step 9: Open Recipe Tab on Search Result Click

## Task Description
Implement the functionality to open a new recipe tab when a user clicks on a recipe name in the search results list within the `SearchTab`. This involves passing a handler function down from the main `App` component (where the tab state is managed) to the `SearchTab`. This handler will add a new tab object to the state and set it as the active tab.

## Files to Read
*   `frontend/src/App.tsx` (To define and pass down the handler, manage tab state)
*   `frontend/src/components/tabs/TabContent.tsx` (To relay the handler)
*   `frontend/src/components/search/SearchTab.tsx` (To receive and use the handler, created step 6, modified step 8)
*   `frontend/src/types/tabs.ts` (To reference the `Tab` interface, created step 5)
*   `frontend/src/api/recipes.ts` (To reference the `RecipeSearchResult` type, created step 8)
*   `frontend/src/components/tabs/TabBar.tsx` (To see how tabs are rendered, created step 5)
## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Modification of `frontend/src/App.tsx`:
    *   Define an arrow function `handleOpenRecipeTab = (recipeId: string, recipeName: string) => { ... }`.
    *   Inside this function:
        *   Check if a tab for this `recipeId` already exists in the `tabs` state. If yes, simply set `activeTabId` to that `recipeId` and return.
        *   If not, create a new `Tab` object: `{ id: recipeId, title: recipeName, type: 'recipe', recipeId: recipeId, isCloseable: true }`. (Using `recipeId` as the tab `id` for simplicity).
        *   Update the `tabs` state by adding the new tab object to the array.
        *   Update the `activeTabId` state to the `recipeId` of the newly opened tab.
    *   Pass `handleOpenRecipeTab` down as a prop through `TabContent`.
*   Modification of `frontend/src/components/tabs/TabContent.tsx`:
    *   Accept the `onOpenRecipeTab` prop (or similar name).
    *   Pass this prop down to the `SearchTab` component when rendering it.
*   Modification of `frontend/src/components/search/SearchTab.tsx`:
    *   Accept the `onOpenRecipeTab: (recipeId: string, recipeName: string) => void` prop.
    *   Modify the rendering of the search results list:
        *   Make each list item (`<li>`) a clickable element (e.g., wrap content in a `<button>` or add `onClick` directly to `<li>`).
        *   In the `onClick` handler for each result item, call `onOpenRecipeTab(recipe.id, recipe.name)`.

## Manual Testing Note
After implementing, restart the Vite dev server. Ensure the backend is running.
*   Search for recipes.
*   Click on a recipe name in the results list.
*   Verify that a new tab appears in the `TabBar` with the recipe's name.
*   Verify that the new tab becomes the active tab.
*   Verify that the `TabContent` area now shows the placeholder text for a recipe tab (e.g., "Recipe Content Area for ID: [the_recipe_id]").
*   Clicking the same recipe again should just switch back to its already open tab without creating a duplicate.
*   Clicking the "Search" tab should switch back to the search view.