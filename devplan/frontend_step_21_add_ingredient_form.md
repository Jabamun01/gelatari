Frontend Step 21: Implement Add Ingredient Form and Mutation
Task Description

Implement the form within the IngredientsTab component to allow users to add new ingredients. Use useState to manage form input state (name, allergen toggle). Use @tanstack/react-query's useMutation hook with the createIngredient API function. On successful creation, invalidate the ['ingredients'] query to refresh the list and clear the form.
Files to Read

    frontend/src/components/ingredients/IngredientsTab.tsx (The component being modified, created step 20)

    frontend/src/api/ingredients.ts (To import createIngredient, created step 19)

    frontend/src/types/ingredient.ts (To import CreateIngredientDto, created step 19)

    frontend/src/main.tsx (To verify QueryClientProvider setup, modified step 7)

    frontend/src/styles/global.ts (For styling, created step 4)

    frontend/src/components/search/SearchTab.tsx (Example of input field usage)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Modification of frontend/src/components/ingredients/IngredientsTab.tsx:

        Import useState.

        Import useMutation, useQueryClient from @tanstack/react-query.

        Import createIngredient API function and CreateIngredientDto type.

        Add state variables for the form inputs:

            const [newName, setNewName] = useState('');

            const [newIsAllergen, setNewIsAllergen] = useState(false);

        Get the query client instance: const queryClient = useQueryClient();

        Set up the mutation:

              
        const createMutation = useMutation({
          mutationFn: createIngredient,
          onSuccess: () => {
            // Invalidate and refetch the ingredients list
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });
            // Clear the form
            setNewName('');
            setNewIsAllergen(false);
            // Optional: Show success notification
          },
          onError: (error) => {
            // Handle error (e.g., display message - duplicate name?)
            console.error("Error creating ingredient:", error);
            // Optional: Show error notification
          },
        });

            

Implement the form submission handler:

      
const handleAddIngredient = (event: React.FormEvent) => {
  event.preventDefault();
  if (!newName.trim()) {
    // Basic validation: name is required
    alert("Ingredient name cannot be empty."); // Replace with better UI later
    return;
  }
  const ingredientData: CreateIngredientDto = {
    name: newName.trim(),
    isAllergen: newIsAllergen,
  };
  createMutation.mutate(ingredientData);
};

    

        Replace the "Add New Ingredient" placeholder with an actual <form> element:

            Include a text input (type="text") bound to the newName state (value={newName}, onChange={e => setNewName(e.target.value)}).

            Include a checkbox (type="checkbox") bound to the newIsAllergen state (checked={newIsAllergen}, onChange={e => setNewIsAllergen(e.target.checked)}). Add a label "Is Allergen?".

            Include a submit button (type="submit") with text "Add Ingredient". Disable the button while the mutation is pending (createMutation.isPending).

            Attach the handleAddIngredient handler to the form's onSubmit event.

        Optionally display mutation status (e.g., "Adding..." when createMutation.isPending).

Manual Testing Note

After implementing, restart the Vite dev server. Ensure the backend is running.

    Go to the "Ingredients" tab.

    Verify the "Add New Ingredient" form is visible with an input field, checkbox, and button.

    Enter a name (e.g., "Sugar") and leave the checkbox unchecked. Click "Add Ingredient".

    Verify the ingredient list refreshes automatically and "Sugar" appears (marked as non-allergen).

    Verify the form fields are cleared.

    Add another ingredient, this time checking "Is Allergen?" (e.g., "Peanuts"). Verify it appears in the list correctly marked as an allergen.

    Try adding an ingredient with the same name again. Verify an error occurs (check console, optionally add UI feedback).

    Try submitting with an empty name. Verify the validation prevents submission.

    Check button disabled state during submission.