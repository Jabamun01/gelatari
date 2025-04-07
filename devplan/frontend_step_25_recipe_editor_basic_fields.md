Frontend Step 25: Implement Recipe Editor Basic Fields
Task Description

Implement the form controls within RecipeEditorTab.tsx for the basic recipe fields: name (text input), type (select dropdown: 'ice cream recipe' / 'not ice cream recipe'), category (select dropdown: 'ice cream' / 'sorbet', only visible and required if type is 'ice cream recipe'), and baseYieldGrams (number input). Connect these controls to the recipeData state managed within the component. Initialize fields correctly based on whether creating new or editing existing.
Files to Read

    frontend/src/components/recipe/RecipeEditorTab.tsx (The component being modified, created step 24)

    frontend/src/types/recipe.ts (To reference RecipeDetails field types and enums, created step 10)

    frontend/src/styles/global.ts (For styling form elements, created step 4)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Modification of frontend/src/components/recipe/RecipeEditorTab.tsx:

        Ensure recipeData state and setRecipeData setter are properly initialized using useState and updated via useEffect when existingRecipe loads (from previous step). The initial state for a new recipe should define defaults (e.g., name: '', type: 'ice cream recipe', category: 'ice cream', baseYieldGrams: 1000, ingredients: [], steps: [], linkedRecipes: []).

        Implement a generic handler function to update the recipeData state for simple input changes:

          
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = event.target;
      // Handle checkbox type if needed later, otherwise:
      const processedValue = type === 'number' ? parseFloat(value) || 0 : value;

      setRecipeData(prev => ({
        ...prev,
        [name]: processedValue,
        // Conditional logic: Reset category if type changes away from 'ice cream recipe'
        ...(name === 'type' && value !== 'ice cream recipe' && { category: undefined }),
        // Conditional logic: Set default category if type changes to 'ice cream recipe' and category was undefined
        ...(name === 'type' && value === 'ice cream recipe' && !prev.category && { category: 'ice cream' }),
      }));
    };

        

        Replace the "Basic Information" placeholder with actual form elements:

            Name: Label and <input type="text" name="name" value={recipeData.name || ''} onChange={handleInputChange} required />

            Type: Label and <select name="type" value={recipeData.type || 'ice cream recipe'} onChange={handleInputChange}> <option value="ice cream recipe">Ice Cream Recipe</option> <option value="not ice cream recipe">Not Ice Cream Recipe</option> </select>

            Category: Conditionally render this section only if recipeData.type === 'ice cream recipe':

                Label and <select name="category" value={recipeData.category || 'ice cream'} onChange={handleInputChange} required> <option value="ice cream">Ice Cream</option> <option value="sorbet">Sorbet</option> </select>

            Base Yield: Label and <input type="number" name="baseYieldGrams" value={recipeData.baseYieldGrams || 1000} onChange={handleInputChange} required min="1" /> (add " g" label next to it).

        Ensure all form elements use the name attribute corresponding to the keys in recipeData.

        Apply styling using Linaria.

Manual Testing Note

After implementing, restart the Vite dev server.

    Open the "New Recipe" editor tab.

        Verify the Name, Type ('ice cream recipe'), Category ('ice cream'), and Base Yield (1000g) fields are displayed with their default values.

        Change the Type to 'not ice cream recipe'. Verify the Category dropdown disappears.

        Change the Type back to 'ice cream recipe'. Verify the Category dropdown reappears, defaulted to 'ice cream'.

        Modify the Name and Base Yield fields. Verify the input values change.

    Simulate editing an existing recipe (e.g., by manually setting a recipeId in TabContent for testing).

        Verify the form fields populate with the data fetched for that recipe after loading.

        Verify changes made in the form update the component's state (use React DevTools).

    Check console for errors.