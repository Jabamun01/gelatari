Frontend Step 29: Implement Recipe Editor Save/Cancel Logic
Task Description

Implement the functionality for the "Save" and "Cancel" buttons in the RecipeEditorTab.tsx.

    Save: Use useMutation to call either a createRecipe or updateRecipe API function (create these if they don't exist or adapt existing ones). Prepare the payload based on the current recipeData state, ensuring ingredient and linked recipe arrays only contain IDs and amounts as expected by the backend. On successful save, invalidate relevant queries (e.g., ['recipes'], ['recipe', recipeId]) and potentially close the editor tab, maybe opening the corresponding RecipeTab. Handle errors.

    Cancel: Implement logic to close the current editor tab without saving changes. This requires interaction with the tab management state in App.tsx.

Files to Read

    frontend/src/components/recipe/RecipeEditorTab.tsx (The component being modified, modified step 28)

    frontend/src/api/recipes.ts (To add/use createRecipe, updateRecipe functions, modified step 10)

    frontend/src/types/recipe.ts (Reference RecipeDetails and define DTOs for create/update, created step 10)

    frontend/src/App.tsx (To add a function to close a tab, modified step 23)

    frontend/src/types/tabs.ts (Reference Tab type, modified step 23)

    frontend/src/main.tsx (QueryClientProvider setup, modified step 7)

    frontend/src/components/tabs/TabBar.tsx (Where close button might eventually live, created step 5)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Modification of frontend/src/types/recipe.ts:

        Define DTO interfaces for create/update payloads expected by the backend:

          
    // Structure matching backend API expectations for POST /api/recipes
    export interface CreateRecipeDto {
        name: string;
        type: 'ice cream recipe' | 'not ice cream recipe';
        category?: 'ice cream' | 'sorbet';
        ingredients: { ingredient: string; amountGrams: number }[]; // ingredient is ID string
        steps: string[];
        baseYieldGrams: number;
        linkedRecipes: { recipe: string; amountGrams: number }[]; // recipe is ID string
    }
    // Structure matching backend API expectations for PUT /api/recipes/:id
    export type UpdateRecipeDto = Partial<CreateRecipeDto>; // Allow partial updates

        

Modification of frontend/src/api/recipes.ts:

    Implement createRecipe = async (recipeData: CreateRecipeDto): Promise<RecipeDetails> => { ... }:

        POST to /api/recipes with recipeData. Handles errors, returns created recipe.

    Implement updateRecipe = async (id: string, recipeData: UpdateRecipeDto): Promise<RecipeDetails> => { ... }:

        PUT to /api/recipes/${id} with recipeData. Handles errors, returns updated recipe.

Modification of frontend/src/App.tsx:

    Add a handler function to close a tab:

      
const handleCloseTab = (tabIdToClose: string) => {
    // Prevent closing essential tabs if needed (e.g., search, ingredients) - handled by isCloseable flag usually
    const tabToClose = tabs.find(tab => tab.id === tabIdToClose);
    if (!tabToClose || !tabToClose.isCloseable) return;

    const tabIndex = tabs.findIndex(tab => tab.id === tabIdToClose);
    const remainingTabs = tabs.filter(tab => tab.id !== tabIdToClose);

    // Determine new active tab (e.g., the one before, or the first one)
    let newActiveTabId = activeTabId;
    if (activeTabId === tabIdToClose) {
        newActiveTabId = tabs[tabIndex - 1]?.id || remainingTabs[0]?.id || ''; // Fallback logic
    }

    setTabs(remainingTabs);
    setActiveTabId(newActiveTabId);
};

    

    Pass handleCloseTab down to TabContent and potentially to RecipeEditorTab. Also pass handleOpenRecipeTab down if needed after save.

Modification of frontend/src/components/recipe/RecipeEditorTab.tsx:

    Accept onClose: () => void; and onOpenRecipeTab: (recipeId: string, recipeName: string) => void; props (these will be bound to handleCloseTab(tabId) and handleOpenRecipeTab in TabContent/App). Accept own tabId: string prop.

    Import useMutation, useQueryClient. Import API functions.

    Get queryClient.

    Set up mutations for create and update:

      
const createRecipeMutation = useMutation({ mutationFn: createRecipe, /* ... */ });
const updateRecipeMutation = useMutation({ mutationFn: ({ id, data }: { id: string, data: UpdateRecipeDto }) => updateRecipe(id, data), /* ... */ });

// Common onSuccess logic for mutations
const handleSaveSuccess = (savedRecipe: RecipeDetails) => {
    queryClient.invalidateQueries({ queryKey: ['recipes'] }); // Invalidate list view
    if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] }); // Invalidate specific recipe view/edit
    }
    // Option 1: Close editor, open RecipeTab for the saved recipe
    onClose(); // Close the editor tab
    onOpenRecipeTab(savedRecipe._id, savedRecipe.name); // Open the display tab

    // Option 2: Stay in editor, maybe reset 'dirty' state (more complex)
}

    

Add onError handling to mutations.

    Implement handleSave = () => { ... }:

        Perform basic validation (e.g., name required).

        Construct the DTO payload (CreateRecipeDto or UpdateRecipeDto) from recipeData state. Crucially, map ingredients and linkedRecipes arrays to contain only the ID string for ingredient and recipe respectively.

        If isEditing, call updateRecipeMutation.mutate({ id: recipeId!, data: updateDto }).

        If not isEditing, call createRecipeMutation.mutate(createDto).

    Implement handleCancel = () => { onClose(); }; (calls the passed-in close handler).

    Connect handleSave and handleCancel to the onClick events of the "Save" and "Cancel" buttons.

    Disable Save button when mutation is pending.

Modification of frontend/src/components/tabs/TabContent.tsx:

    Accept onCloseTab: (tabId: string) => void and onOpenRecipeTab props from App.

    Pass the correctly bound handlers down to RecipeEditorTab:

      
if (activeTab.type === 'recipeEditor') {
   return <RecipeEditorTab
       recipeId={activeTab.recipeId}
       tabId={activeTab.id} // Pass the tab's own ID
       onClose={() => onCloseTab(activeTab.id)} // Pass a function that closes THIS tab
       onOpenRecipeTab={onOpenRecipeTab} // Pass down the recipe opener
   />;
 }

    

Manual Testing Note

After implementing, restart Vite dev server.

    Cancel:

        Open "New Recipe" editor. Make some changes. Click "Cancel". Verify editor tab closes.

        Open an existing recipe for editing (requires step 30, or simulate). Click "Cancel". Verify editor tab closes.

    Save (New):

        Open "New Recipe" editor. Fill in required fields (name, etc.), add ingredients/steps. Click "Save".

        Verify mutation runs (check network tab).

        Verify editor tab closes.

        Verify a new RecipeTab opens for the newly created recipe.

        Verify the recipe list query is invalidated (e.g., check search results).

    Save (Edit):

        Open existing recipe for editing (simulate/implement step 30). Change name/ingredients. Click "Save".

        Verify mutation runs.

        Verify editor tab closes.

        Verify RecipeTab for that recipe opens/refreshes with the updated data.

    Test save errors (e.g., invalid data if backend validation fails).