Frontend Step 26: Implement Recipe Editor Components Section
Task Description

Implement the section within RecipeEditorTab.tsx for managing the recipe's components (which can be either ingredients or other recipes). This includes:

    Fetching the global list of available ingredients (using useQuery for getAllIngredients).
    Fetching the global list of available recipes (using useQuery for getAllRecipes - excluding the recipe being edited, if applicable).
    Combining these lists for a unified selection mechanism (e.g., a dropdown with optgroups).
    Providing an input for the amount (in grams).
    An "Add Component" button to add the selected item (ingredient or recipe) and amount to the appropriate array in the recipeData state (`ingredients` or `linkedRecipes`).
    Displaying a single list of components currently added to the recipe (both ingredients and linked recipes), with their amounts and a "Remove" button for each.

Files to Read

    frontend/src/components/recipe/RecipeEditorTab.tsx (The component being modified, modified step 25)
    frontend/src/api/ingredients.ts (To import getAllIngredients, created step 19)
    frontend/src/api/recipes.ts (To import getAllRecipes, modified step 10)
    frontend/src/types/ingredient.ts (To import Ingredient, created step 19)
    frontend/src/types/recipe.ts (To reference RecipeIngredient, LinkedRecipeInfo, RecipeDetails, created step 10)
    frontend/src/main.tsx (QueryClientProvider setup, modified step 7)
    frontend/src/styles/global.ts (For styling, created step 4)
    frontend/src/utils/formatting.ts (If formatAmount utility exists)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.
    Write all code exclusively within the provided tool.
    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Modification of frontend/src/components/recipe/RecipeEditorTab.tsx:

        Import getAllIngredients from ../../api/ingredients.
        Import getAllRecipes from ../../api/recipes.
        Import Ingredient type from ../../types/ingredient.
        Import RecipeIngredient, LinkedRecipeInfo types from ../../types/recipe.

        Fetch all available ingredients:
          ```typescript
          const { data: availableIngredients = [], isLoading: isLoadingIngredients } = useQuery({
            queryKey: ['ingredients'],
            queryFn: getAllIngredients,
          });
          ```

        Fetch all available recipes (potentially filter out the current recipe if editing):
          ```typescript
          const { data: availableRecipes = [], isLoading: isLoadingRecipes } = useQuery({
            queryKey: ['recipes'], // Use a standard key for recipes list
            queryFn: getAllRecipes, // Assuming getAllRecipes fetches basic list (_id, name)
            // Optional: Select/transform data if needed
          });
          ```
          *Note: `getAllRecipes` might need adjustments or a different endpoint might be better suited if it returns full details.*

        Add state for the "Add Component" form section:
          ```typescript
          const [selectedComponentId, setSelectedComponentId] = useState<string>(''); // Stores ID_type (e.g., "ing_123", "rec_456")
          const [componentAmount, setComponentAmount] = useState<string>(''); // Store as string for input control
          ```

        Create a memoized combined list for the dropdown:
          ```typescript
          const availableComponents = useMemo(() => {
            const ingredients = availableIngredients.map(ing => ({ id: `ing_${ing._id}`, name: ing.name, type: 'ingredient' as const }));
            const recipes = availableRecipes
              .filter(rec => rec._id !== recipeId) // Exclude self if editing
              .map(rec => ({ id: `rec_${rec._id}`, name: rec.name, type: 'recipe' as const }));
            return { ingredients, recipes };
          }, [availableIngredients, availableRecipes, recipeId]);
          ```

        Implement handler functions:

          ```typescript
          // Handler to add the selected component to the recipeData state
          const handleAddRecipeComponent = () => {
            const amountGrams = parseInt(componentAmount, 10);
            if (!selectedComponentId || !amountGrams || amountGrams <= 0) {
              alert('Please select a component and enter a valid positive amount.'); // Use better UI feedback
              return;
            }

            const [type, id] = selectedComponentId.split('_'); // e.g., "ing", "123"

            if (type === 'ingredient') {
              const ingredientToAdd = availableIngredients.find(ing => ing._id === id);
              if (!ingredientToAdd) return;

              // Prevent adding the same ingredient twice
              if (recipeData.ingredients?.some(item => item.ingredient._id === id)) {
                 alert(`${ingredientToAdd.name} is already in the recipe.`);
                 return;
              }

              const newRecipeIngredient: RecipeIngredient = {
                ingredient: { _id: id, name: ingredientToAdd.name, isAllergen: ingredientToAdd.isAllergen },
                amountGrams: amountGrams,
              };

              setRecipeData(prev => ({
                ...prev,
                ingredients: [...(prev.ingredients || []), newRecipeIngredient],
              }));

            } else if (type === 'recipe') {
              const recipeToAdd = availableRecipes.find(rec => rec._id === id);
              if (!recipeToAdd) return;

              // Prevent adding the same linked recipe twice
              if (recipeData.linkedRecipes?.some(item => item.recipe._id === id)) {
                 alert(`${recipeToAdd.name} is already linked in the recipe.`);
                 return;
              }

              const newLinkedRecipe: LinkedRecipeInfo = {
                recipe: { _id: id, name: recipeToAdd.name }, // Store minimal info needed
                amountGrams: amountGrams,
              };

              setRecipeData(prev => ({
                ...prev,
                linkedRecipes: [...(prev.linkedRecipes || []), newLinkedRecipe],
              }));
            }

            // Clear the add form
            setSelectedComponentId('');
            setComponentAmount('');
          };

          // Handler to remove a component from the recipeData state
          const handleRemoveRecipeComponent = (componentIdToRemove: string, componentType: 'ingredient' | 'recipe') => {
            if (componentType === 'ingredient') {
              setRecipeData(prev => ({
                ...prev,
                ingredients: prev.ingredients?.filter(item => item.ingredient._id !== componentIdToRemove) || [],
              }));
            } else if (componentType === 'recipe') {
              setRecipeData(prev => ({
                ...prev,
                linkedRecipes: prev.linkedRecipes?.filter(item => item.recipe._id !== componentIdToRemove) || [],
              }));
            }
          };
          ```

        Replace the "Components" placeholder section:

            Display Current Components:
                Create a combined list from `recipeData.ingredients` and `recipeData.linkedRecipes` for rendering.
                Render a single list (<ul>) of all components.
                For each item, display its name (e.g., `item.ingredient.name` or `item.recipe.name`), amount (`item.amountGrams`g), and potentially indicate if it's an ingredient or recipe. Highlight allergens for ingredients.
                Include a "Remove" button calling `handleRemoveRecipeComponent` with the correct ID and type (`'ingredient'` or `'recipe'`).

            Add Component Form:
                Render loading messages if `isLoadingIngredients` or `isLoadingRecipes`.
                Render a `<select>` element populated with `<optgroup>` for Ingredients and Recipes from `availableComponents`:
                    Bind its value to `selectedComponentId` and `onChange` to `setSelectedComponentId(e.target.value)`.
                    Include a default disabled option like "-- Select Component --".
                    Each option's value should be the combined ID (`ing_${id}` or `rec_${id}`) and text the component name.
                Render an `<input type="number" min="1">` for the amount:
                    Bind its value to `componentAmount` and `onChange` to `setComponentAmount(e.target.value)`.
                    Add a "g" label.
                Render an "Add Component" button calling `handleAddRecipeComponent`.

Manual Testing Note

After implementing, restart the Vite dev server. Ensure backend has ingredients and recipes.

    Open the "New Recipe" editor tab.
    Verify the "Components" section shows the dropdown, amount input, and "Add Component" button.
    Verify the component dropdown is populated with ingredients and recipes fetched from the backend (or shows loading), possibly grouped.
    Select an ingredient, enter an amount (e.g., 100), and click "Add Component".
        Verify the ingredient appears in the "Current Components" list, showing name, amount, type (optional), and a "Remove" button. Allergens should be highlighted.
        Verify the dropdown and amount input are cleared.
    Select a recipe, enter an amount (e.g., 50), and click "Add Component".
        Verify the recipe appears in the "Current Components" list, showing name, amount, type (optional), and a "Remove" button.
        Verify the dropdown and amount input are cleared.
    Add another ingredient or recipe. Verify they appear correctly.
    Click the "Remove" button next to an ingredient. Verify it disappears.
    Click the "Remove" button next to a recipe. Verify it disappears.
    Test validation (try adding without selecting/amount).
    Simulate editing a recipe with existing ingredients and linked recipes. Verify they are displayed correctly in the single list initially.