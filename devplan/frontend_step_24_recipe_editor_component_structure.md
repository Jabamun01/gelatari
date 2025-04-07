Frontend Step 24: Implement Recipe Editor Component Structure
Task Description

Create the basic structure for the RecipeEditorTab component. This component will handle both creating new recipes and editing existing ones. It should accept an optional recipeId prop. If recipeId is provided, it should use useQuery to fetch the existing recipe data. If recipeId is absent, it should initialize state for a new recipe. Render placeholders for all form sections (basic info, ingredients, steps, linked recipes, etc.) and Save/Cancel buttons.
Files to Read

    frontend/src/components/tabs/TabContent.tsx (To integrate the editor component, modified step 23)

    frontend/src/api/recipes.ts (To import fetchRecipeById, modified step 10)

    frontend/src/types/recipe.ts (To import RecipeDetails, created step 10)

    frontend/src/types/tabs.ts (To understand the Tab structure for 'recipeEditor', modified step 23)

    frontend/src/main.tsx (QueryClientProvider setup, modified step 7)

    frontend/src/styles/global.ts (For styling, created step 4)

    frontend/src/components/recipe/RecipeTab.tsx (Example of fetching recipe data via useQuery, modified step 17)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Creation of frontend/src/components/recipe/RecipeEditorTab.tsx.

    Content of RecipeEditorTab.tsx:

        Import React, useState, useEffect.

        Import useQuery from @tanstack/react-query.

        Import fetchRecipeById from ../../api/recipes.

        Import RecipeDetails from ../../types/recipe.

        Define props interface: { recipeId?: string; }.

        Implement the RecipeEditorTab component:

            Accept recipeId prop.

            Determine if it's an edit session: const isEditing = !!recipeId;.

            Use useQuery to fetch existing data only if isEditing:

              
        const { data: existingRecipe, isLoading, isError, error } = useQuery({
          queryKey: ['recipe', recipeId],
          queryFn: () => fetchRecipeById(recipeId!), // ! assertion safe due to enabled flag
          enabled: isEditing, // Only run query if recipeId is provided
          // Optional: configure staleTime, cacheTime etc.
        });

            

        Use useState to manage the form state. This state should hold all editable fields of a recipe (name, type, category, ingredients array, steps array, baseYield, linkedRecipes array).

            Initialize this state either with default/empty values (if !isEditing) or with the fetched existingRecipe data once it loads (using a useEffect hook that watches existingRecipe).

            Example state structure: const [recipeData, setRecipeData] = useState<Partial<RecipeDetails>>({ /* initial empty/default state */ });

        Handle loading (isLoading) and error (isError) states for the fetch query when isEditing.

        Render the main structure:

            Display loading/error messages if applicable.

            Render a form container.

            Inside the form, render placeholders or headings for:

                "Basic Information (Name, Type, Category)"

                "Ingredients"

                "Steps"

                "Base Yield"

                "Linked Recipes (Components)"

            Render "Save" and "Cancel" buttons (functionality TBD).

Modification of frontend/src/components/tabs/TabContent.tsx:

    Import RecipeEditorTab.

    Update the conditional rendering for 'recipeEditor' to render the actual component:

      
if (activeTab.type === 'recipeEditor') {
  return <RecipeEditorTab recipeId={activeTab.recipeId} />;
}

    

Manual Testing Note

After implementing, restart the Vite dev server. Ensure the backend is running.

    Click the "New Recipe" button. Verify the "Recipe Editor Placeholder" is replaced by the new editor structure, showing the section placeholders and Save/Cancel buttons. Check console for errors. Initial form state should be empty/default.

    Search for an existing recipe and open its RecipeTab. (Add an "Edit" button to RecipeTab in a later step to test editing flow properly). Alternative testing for now: Manually modify App.tsx to open an editor tab with a known valid recipeId to simulate editing. Verify:

        A loading state appears briefly.

        The editor structure appears.

        (Later steps will populate fields) Check console for fetch request/response.

        Test error state by providing an invalid recipeId.