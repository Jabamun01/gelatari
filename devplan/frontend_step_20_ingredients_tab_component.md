Frontend Step 20: Implement Ingredients Tab Component - Display List
Task Description

Create the main component for the "Ingredients" tab (IngredientsTab.tsx). Use @tanstack/react-query's useQuery hook to fetch the list of all ingredients using the getAllIngredients API function created in the previous step. Display the fetched ingredients in a styled list, showing the name and allergen status. Include placeholders for adding new ingredients. Handle loading and error states.
Files to Read

    frontend/src/components/tabs/TabContent.tsx (To integrate the new component, modified step 18)

    frontend/src/api/ingredients.ts (To import getAllIngredients, created step 19)

    frontend/src/types/ingredient.ts (To import Ingredient type, created step 19)

    frontend/src/main.tsx (To verify QueryClientProvider setup, modified step 7)

    frontend/src/styles/global.ts (For styling, created step 4)

    frontend/src/components/search/SearchTab.tsx (Example of useQuery usage and list display, modified step 8)

    frontend/src/components/recipe/IngredientList.tsx (Example list styling and conditional rendering, modified step 16)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Creation of frontend/src/components/ingredients/ directory.

    Creation of frontend/src/components/ingredients/IngredientsTab.tsx.

    Content of IngredientsTab.tsx:

        Import React, useQuery from @tanstack/react-query.

        Import getAllIngredients from ../../api/ingredients.

        Import Ingredient from ../../types/ingredient.

        Import styled from @linaria/react.

        Define styled components for the main container, list (ul), list items (li), and potentially different styles for allergens (using --allergen-highlight-color).

        Implement the IngredientsTab component:

            Use useQuery:

                queryKey: ['ingredients']

                queryFn: getAllIngredients

            Handle isLoading and isError states appropriately (display messages).

            When data (the Ingredient[]) is available:

                Render a styled list (<ul>).

                Map over the data array.

                For each ingredient, render a styled list item (<li>) displaying:

                    ingredient.name

                    Indication of allergen status (e.g., "(Allergen)" text, different color/styling if ingredient.isAllergen is true).

                Render a placeholder area/heading for "Add New Ingredient" (form will be added next step).

    Modification of frontend/src/components/tabs/TabContent.tsx:

        Import the IngredientsTab component.

        Update the conditional rendering logic for the 'ingredients' tab type to render <IngredientsTab /> instead of the placeholder div.

Manual Testing Note

After implementing, restart the Vite dev server. Ensure the backend server is running and has some ingredient data.

    Click the "Ingredients" tab.

    Verify a loading indicator is shown briefly.

    Verify the list of ingredients fetched from the backend is displayed.

    Check that ingredient names and their allergen status are correctly shown. Allergens should be visually distinct.

    Verify the "Add New Ingredient" placeholder area is visible.

    Test error state (stop backend, refresh tab).

    Check console for errors.