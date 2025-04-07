Frontend Step 22: Implement Edit (Allergen Toggle) and Delete Ingredient
Task Description

Enhance the ingredient list in IngredientsTab.tsx to allow users to toggle the allergen status of existing ingredients and delete ingredients. Use useMutation for both update and delete operations, leveraging the API functions created earlier. Invalidate the ingredients query on success. Add a confirmation step before deletion.
Files to Read

    frontend/src/components/ingredients/IngredientsTab.tsx (The component being modified, modified step 21)

    frontend/src/api/ingredients.ts (To import updateIngredient, deleteIngredient, created step 19)

    frontend/src/types/ingredient.ts (To import UpdateIngredientDto, Ingredient, created step 19)

    frontend/src/main.tsx (To verify QueryClientProvider setup, modified step 7)

    frontend/src/styles/global.ts (For styling buttons, created step 4)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Modification of frontend/src/components/ingredients/IngredientsTab.tsx:

        Import updateIngredient, deleteIngredient API functions and UpdateIngredientDto type.

        Import useMutation, useQueryClient (if not already at the top level).

        Get the query client instance: const queryClient = useQueryClient(); (if not already done).

        Set up the update mutation (for toggling allergen):

              
        const updateMutation = useMutation({
          mutationFn: ({ id, updates }: { id: string; updates: UpdateIngredientDto }) => updateIngredient(id, updates),
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });
          },
          onError: (error) => {
            console.error("Error updating ingredient:", error);
            // Optional: Show error notification
          },
        });

            

Set up the delete mutation:

      
const deleteMutation = useMutation({
  mutationFn: deleteIngredient,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ingredients'] });
  },
  onError: (error) => {
    console.error("Error deleting ingredient:", error);
    // Optional: Show error notification
  },
});

    

Implement handler functions:

      
const handleToggleAllergen = (ingredient: Ingredient) => {
  const updates: UpdateIngredientDto = { isAllergen: !ingredient.isAllergen };
  updateMutation.mutate({ id: ingredient._id, updates });
};

const handleDeleteIngredient = (id: string, name: string) => {
  // Simple confirmation dialog
  if (window.confirm(`Are you sure you want to delete "${name}"? This might affect existing recipes.`)) {
     deleteMutation.mutate(id);
  }
};

    

        Modify the rendering logic within the ingredient list map (data.map(...)):

            For each ingredient <li>, add two buttons (styled using Linaria):

                An "Toggle Allergen" button (or just a toggle switch). Its onClick handler should call handleToggleAllergen(ingredient). Disable this button if updateMutation.isPending for this specific ingredient (might need more complex state management for per-item loading, or disable all during any update).

                A "Delete" button. Its onClick handler should call handleDeleteIngredient(ingredient._id, ingredient.name). Disable this button if deleteMutation.isPending for this specific ingredient.

Manual Testing Note

After implementing, restart the Vite dev server. Ensure the backend is running with ingredients.

    Go to the "Ingredients" tab.

    Verify each ingredient in the list now has "Toggle Allergen" and "Delete" buttons.

    Click "Toggle Allergen" for a non-allergen ingredient. Verify the list refreshes, and it's now marked as an allergen.

    Click "Toggle Allergen" again for the same ingredient. Verify it toggles back.

    Click "Delete" for an ingredient. Verify a confirmation dialog appears.

    Click "Cancel" in the dialog. Verify the ingredient is NOT deleted.

    Click "Delete" again and click "OK" in the dialog. Verify the list refreshes, and the ingredient is removed.

    Check button disabled states during mutation operations if implemented.

    Check console for errors.