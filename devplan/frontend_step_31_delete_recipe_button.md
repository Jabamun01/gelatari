Frontend Step 31: Implement Recipe Deletion Button
Task Description

Add a "Delete" button to the RecipeTab component. Clicking this button should prompt the user for confirmation and, if confirmed, call the backend API to delete the recipe. Use useMutation for the delete operation. On successful deletion, invalidate relevant queries and close the current RecipeTab.
Files to Read

    frontend/src/components/recipe/RecipeTab.tsx (The component being modified, modified step 30)

    frontend/src/api/recipes.ts (To add the deleteRecipe API function, modified step 29)

    frontend/src/App.tsx (To ensure handleCloseTab is passed down, modified step 29)

    frontend/src/components/tabs/TabContent.tsx (To ensure onCloseTab prop is passed to RecipeTab, modified step 29)

    frontend/src/main.tsx (QueryClientProvider setup, modified step 7)

    frontend/src/styles/global.ts (For styling the delete button, created step 4)

    Backend Step 16 (devplan/backend_step_16_recipe_routes.md) for the DELETE /api/recipes/:id endpoint definition.

    frontend/src/components/ingredients/IngredientsTab.tsx (Example of delete mutation and confirmation, modified step 22)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Modification of frontend/src/api/recipes.ts:

        Implement deleteRecipe = async (id: string): Promise<void> => { ... }:

            Makes a DELETE request to /api/recipes/${id}.

            Handles errors (e.g., 404 Not Found). Throws error or returns void/status.

    Modification of frontend/src/components/tabs/TabContent.tsx:

        Ensure the onCloseTab prop (bound to handleCloseTab in App.tsx) is correctly passed down to the RecipeTab component instance. (This might already be done if RecipeEditorTab needs it, double-check). If not, add it:

          
    // Inside the 'recipe' type condition
    return <RecipeTab
        recipeId={activeTab.recipeId!}
        tabId={activeTab.id} // Pass tabId if needed by RecipeTab, e.g., for onClose
        onOpenEditor={onOpenRecipeEditor} // Assuming passed from App
        onClose={() => onCloseTab(activeTab.id)} // Pass the bound close handler
    />;

        

Modification of frontend/src/components/recipe/RecipeTab.tsx:

    Accept onClose: () => void; prop (maps to the bound onCloseTab for this specific tab instance).

    Import deleteRecipe from ../../api/recipes.

    Import useMutation, useQueryClient from @tanstack/react-query.

    Get the query client instance: const queryClient = useQueryClient();.

    Set up the delete mutation:

          
    const deleteRecipeMutation = useMutation({
      mutationFn: deleteRecipe, // API function to call
      onSuccess: () => {
        // Invalidate queries to refresh lists/search
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
        // Optionally remove specific recipe query data if needed immediately
        queryClient.removeQueries({ queryKey: ['recipe', recipeId] });

        // Close the current tab AFTER successful deletion
        onClose();
      },
      onError: (error) => {
        console.error("Error deleting recipe:", error);
        alert("Failed to delete recipe. See console for details."); // Use better UI feedback
      },
    });

        

Implement the delete handler:

      
const handleDeleteRecipe = () => {
  // Check if data exists before attempting delete
  if (!data) return;

  if (window.confirm(`Are you sure you want to delete the recipe "${data.name}"? This action cannot be undone.`)) {
    deleteRecipeMutation.mutate(recipeId); // recipeId is from props
  }
};

    

        Add a styled "Delete Recipe" button (e.g., near the "Edit" button). Apply dangerous action styling (e.g., red color).

        Attach the handleDeleteRecipe handler to the button's onClick event.

        Disable the button when data is not loaded or when deleteRecipeMutation.isPending.

Manual Testing Note

After implementing, restart the Vite dev server. Ensure the backend is running.

    Open an existing recipe in a RecipeTab.

    Verify the "Delete Recipe" button is visible.

    Click the "Delete Recipe" button. Verify a confirmation dialog appears.

    Click "Cancel" on the dialog. Verify the recipe is NOT deleted and the tab remains open.

    Click "Delete Recipe" again. Click "OK" on the dialog.

    Verify the mutation runs (check network tab for DELETE request).

    Verify the RecipeTab closes automatically upon successful deletion.

    Verify the recipe no longer appears in search results or other lists (may require refreshing search).

    Test deleting a recipe that might be linked by another (backend should handle this, but frontend assumes deletion is allowed).

    Check console for errors, especially if deletion fails.