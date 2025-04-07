Frontend Step 27: Implement Recipe Editor Steps Section
Task Description

Implement the section within RecipeEditorTab.tsx for managing the recipe's steps. This includes:

    Displaying the current list of steps from recipeData.steps state, each in an editable text area or input.

    Providing buttons to add a new empty step, remove an existing step, and potentially reorder steps (optional - skip reordering for simplicity).

    Adding buttons ("Add Ice Cream Defaults", "Add Sorbet Defaults") that fetch default steps from the backend (/api/default-steps/:category) based on the recipe's selected category (if applicable) and append them to the current steps list in the state.

Files to Read

    frontend/src/components/recipe/RecipeEditorTab.tsx (The component being modified, modified step 26)

    frontend/src/types/recipe.ts (To reference RecipeDetails.steps, created step 10)

    frontend/src/styles/global.ts (For styling, created step 4)

    Backend Step 20 (devplan/backend_step_20_default_steps_routes.md) for default steps endpoint.

    Backend Step 18 (devplan/backend_step_18_default_steps_service.md) for default steps service logic.

    frontend/src/api/recipes.ts (Maybe add default steps fetch function here or create api/defaultSteps.ts)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Creation or Modification of API functions file (e.g., frontend/src/api/defaultSteps.ts or add to recipes.ts):

        Implement fetchDefaultSteps = async (category: 'ice cream' | 'sorbet'): Promise<string[]> => { ... }:

            Makes GET request to /api/default-steps/${category}.

            Handles errors and returns the steps array.

    Modification of frontend/src/components/recipe/RecipeEditorTab.tsx:

        Import fetchDefaultSteps (adjust path).

        Ensure recipeData.steps is initialized as [] in the state for new recipes.

        Implement handler functions:

          
    // Update a step at a specific index
    const handleStepChange = (index: number, value: string) => {
      setRecipeData(prev => {
        const newSteps = [...(prev.steps || [])];
        newSteps[index] = value;
        return { ...prev, steps: newSteps };
      });
    };

    // Add a new empty step at the end
    const handleAddStep = () => {
      setRecipeData(prev => ({
        ...prev,
        steps: [...(prev.steps || []), ''], // Add empty string for new step
      }));
    };

    // Remove a step at a specific index
    const handleRemoveStep = (index: number) => {
      setRecipeData(prev => ({
        ...prev,
        steps: prev.steps?.filter((_, i) => i !== index) || [],
      }));
    };

    // Fetch and append default steps
    const handleAppendDefaultSteps = async (category: 'ice cream' | 'sorbet') => {
        try {
            // Consider adding loading state feedback
            const defaultSteps = await fetchDefaultSteps(category);
            setRecipeData(prev => ({
                ...prev,
                steps: [...(prev.steps || []), ...defaultSteps],
            }));
        } catch (error) {
            console.error("Failed to fetch default steps:", error);
            alert(`Failed to load default steps for ${category}.`); // Use better UI
        }
    };

        

        Replace the "Steps" placeholder section:

            Render an ordered list (<ol>) for the steps in recipeData.steps.

            For each step string at index, render:

                A <textarea> or <input type="text"> element bound to the step value (value={step}, onChange={e => handleStepChange(index, e.target.value)}). Use textarea for multi-line steps.

                A "Remove" button next to each step, calling handleRemoveStep(index).

            Add an "Add New Step" button below the list, calling handleAddStep.

            Conditionally render "Add Ice Cream Defaults" and "Add Sorbet Defaults" buttons only if recipeData.type === 'ice cream recipe'.

                The "Add Ice Cream Defaults" button should call handleAppendDefaultSteps('ice cream').

                The "Add Sorbet Defaults" button should call handleAppendDefaultSteps('sorbet'). Make these buttons prominent.

Manual Testing Note

After implementing, restart the Vite dev server. Ensure backend default steps are seeded.

    Open the "New Recipe" editor tab.

    Verify the "Steps" section is initially empty, with an "Add New Step" button.

    If Type is 'ice cream recipe', verify the "Add Ice Cream/Sorbet Defaults" buttons are visible.

    Click "Add New Step". Verify a new empty textarea/input appears with a "Remove" button.

    Type text into the step input. Verify the state updates (React DevTools).

    Add multiple steps.

    Click "Remove" next to a step. Verify it disappears.

    Click "Add Ice Cream Defaults". Verify the default steps (fetched from backend) are appended to the list. Test "Add Sorbet Defaults" similarly.

    Change Type to 'not ice cream recipe'. Verify the default step buttons disappear.

    Simulate editing a recipe with existing steps. Verify they are displayed correctly in the inputs.