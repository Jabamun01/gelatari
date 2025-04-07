Frontend Step 30: Add Edit Button to Recipe Tab
Task Description

Add an "Edit" button to the RecipeTab component. Clicking this button should open the RecipeEditorTab for the recipe currently being viewed. This involves passing down the necessary handler function from App.tsx to open an editor tab for a specific recipeId.
Files to Read

    frontend/src/components/recipe/RecipeTab.tsx (Component to add button to, modified step 17)

    frontend/src/App.tsx (To define/pass down handler for opening editor for specific ID, modified step 29)

    frontend/src/types/tabs.ts (Reference Tab types, modified step 23)

    frontend/src/styles/global.ts (For styling, created step 4)

    frontend/src/components/tabs/TabContent.tsx (How props are passed down, modified step 29)

    frontend/src/components/recipe/RecipeEditorTab.tsx (The component being opened, modified step 29)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Modification of frontend/src/App.tsx:

        Define a handler function handleOpenRecipeEditor = (recipeId: string, recipeName: string) => { ... }.

        Inside this function:

            Generate a unique editor tab ID, perhaps incorporating the recipe ID: const editorTabId = editor-${recipeId};.

            Check if an editor tab with this ID already exists. If yes, just set it as active and return.

            Create a new Tab object for the editor: { id: editorTabId, title: Edit: ${recipeName}, type: 'recipeEditor', recipeId: recipeId, isCloseable: true }.

            Update tabs state, add the new tab.

            Update activeTabId to editorTabId.

        Pass handleOpenRecipeEditor down through TabContent.

    Modification of frontend/src/components/tabs/TabContent.tsx:

        Accept onOpenRecipeEditor: (recipeId: string, recipeName: string) => void prop.

        Pass this prop down to RecipeTab.

    Modification of frontend/src/components/recipe/RecipeTab.tsx:

        Accept onOpenEditor: (recipeId: string, recipeName: string) => void prop.

        Add a styled "Edit" button somewhere in the component (e.g., near the title).

        Attach an onClick handler to the button that calls onOpenEditor(recipeId, data.name) (using the fetched data and the recipeId prop). Only enable/render this button when data is successfully loaded.

Manual Testing Note

After implementing, restart the Vite dev server.

    Search for and open a recipe in a RecipeTab.

    Verify an "Edit" button is visible on the recipe view.

    Click the "Edit" button.

    Verify a new tab opens titled "Edit: [Recipe Name]".

    Verify this new tab is the RecipeEditorTab component, pre-populated with the data for the recipe being edited (check fields implemented in previous steps).

    Verify the original RecipeTab remains open.

    Test opening the editor for multiple different recipes.

    Test clicking "Edit" on a recipe whose editor is already open - it should just switch to the existing editor tab.