# Frontend Step 10: Implement Recipe Tab Component Structure

## Task Description
Create the `RecipeTab` component responsible for displaying the details of a single recipe. This component will receive a `recipeId` prop. Use `@tanstack/react-query`'s `useQuery` hook to fetch the full recipe details from the backend API (`GET /api/recipes/:id`). Display basic recipe information (name, type, category) and placeholders for ingredient list, step list, and scaling control. Handle loading and error states for the query.

## Files to Read
*   `frontend/src/components/tabs/TabContent.tsx` (To integrate the `RecipeTab` component, modified step 6, step 9)
*   `frontend/src/types/tabs.ts` (To reference the `Tab` interface, created step 5)
*   `frontend/src/api/recipes.ts` (To add `fetchRecipeById`, created step 8)
*   `frontend/src/main.tsx` (To see QueryClient setup from step 7)
*   `frontend/src/components/search/SearchTab.tsx` (Example component using useQuery, from step 8)
*   `frontend/src/App.tsx` (Where tab state lives, modified step 9)
## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend. Define necessary types (e.g., for full Recipe details) independently in the frontend.

## Deliverables
*   Creation of `frontend/src/components/recipe/` directory.
*   Creation of `frontend/src/types/recipe.ts` (or similar) to define the frontend's view of a full recipe:
    ```typescript
    // Example - Adjust based on actual backend response structure after population
    interface RecipeIngredient {
      ingredient: { // Populated data
        _id: string; // Or just id
        name: string;
        isAllergen: boolean;
      };
      amountGrams: number;
    }

    interface LinkedRecipeInfo {
       recipe: { // Populated data
         _id: string; // Or just id
         name: string;
       };
       amountGrams: number;
    }

    export interface RecipeDetails {
      _id: string; // Or just id
      name: string;
      type: 'ice cream recipe' | 'not ice cream recipe';
      category?: 'ice cream' | 'sorbet';
      ingredients: RecipeIngredient[];
      steps: string[];
      baseYieldGrams: number;
      linkedRecipes: LinkedRecipeInfo[];
      // Add other fields if necessary
    }
    ```
*   Update `frontend/src/api/recipes.ts`:
    *   Add an asynchronous arrow function `fetchRecipeById(recipeId: string): Promise<RecipeDetails>` that fetches `/api/recipes/${recipeId}`, handles errors, and returns the parsed `RecipeDetails`.
*   Creation of `frontend/src/components/recipe/RecipeTab.tsx`:
    *   Accept `recipeId: string` as a prop.
    *   Import `useQuery` from `@tanstack/react-query`.
    *   Import `fetchRecipeById` and `RecipeDetails`.
    *   Use the `useQuery` hook:
        *   `queryKey`: `['recipe', recipeId]`
        *   `queryFn`: `() => fetchRecipeById(recipeId)`
        *   Consider `staleTime` or `cacheTime` if desired.
    *   Render loading state (`isLoading`).
    *   Render error state (`isError`).
    *   When `data` is available (`RecipeDetails`):
        *   Display `data.name`, `data.type`, `data.category` (if present).
        *   Render placeholder text/divs for "Ingredient List Area", "Steps Area", "Scaling Control Area".
*   Modification of `frontend/src/components/tabs/TabContent.tsx`:
    *   Import the `RecipeTab` component.
    *   Update the conditional rendering: When `activeTab.type === 'recipe'`, render `<RecipeTab recipeId={activeTab.recipeId!} />` (use non-null assertion `!` as `recipeId` is guaranteed for this type).

## Manual Testing Note
After implementing, restart the Vite dev server. Ensure the backend is running with recipe data.
*   Search for a recipe and click it to open its tab.
*   Verify that a loading indicator is shown briefly.
*   Verify that the recipe's name, type, and category (if applicable) are displayed.
*   Verify that the placeholder areas for ingredients, steps, and scaling are visible.
*   Test error handling: Stop the backend and try opening a recipe tab; an error message should appear. Check console for errors.