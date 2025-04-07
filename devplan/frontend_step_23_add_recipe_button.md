Frontend Step 23: Add Button to Initiate New Recipe Creation
Task Description

Add a dedicated button, likely in the TabBar component, to allow users to start creating a new recipe. Clicking this button should open a new, specialized tab type (e.g., 'recipeEditor') intended for creating or editing recipes. Update the tab management logic in App.tsx to handle opening this new tab type.
Files to Read

    frontend/src/components/tabs/TabBar.tsx (To add the button, created step 5)

    frontend/src/App.tsx (To add handler logic for the new button, manage tab state, modified step 5, 9, 14, 18)

    frontend/src/types/tabs.ts (To add the new 'recipeEditor' tab type, modified step 5, 9, 14, 18)

    frontend/src/components/tabs/TabContent.tsx (To add conditional rendering for the editor tab, modified step 6, 9, 10, 18, 20)

    frontend/src/styles/global.ts (For styling the new button, created step 4)

Constraints Reminder

    Use only arrow functions (=>) for all JavaScript/TypeScript code. No function, class, or this.

    Write all code exclusively within the provided tool.

    Adhere to the "No Shared Code" policy between frontend and backend.

Deliverables

    Modification of frontend/src/types/tabs.ts:

        Add 'recipeEditor' to the TabType union: export type TabType = 'search' | 'recipe' | 'ingredients' | 'recipeEditor';

        The Tab interface should accommodate this: recipeId will be present when editing an existing recipe, but potentially absent or a special value (e.g., 'new') when creating a new one. The id field needs to be unique for each editor instance. Consider adding an optional isNew?: boolean flag.

          
    export interface Tab {
       id: string; // Unique ID for the tab instance (e.g., recipeId, 'search', 'ingredients', 'editor-<uuid>')
       title: string;
       type: TabType;
       recipeId?: string; // ID of recipe being viewed or edited
       isCloseable: boolean;
       initialScaleFactor?: number;
       // isNew?: boolean; // Optional flag for editor tabs
     }

        

Modification of frontend/src/App.tsx:

    Define a handler function handleOpenNewRecipeEditor = () => { ... }.

    Inside the handler:

        Generate a unique ID for the new editor tab (e.g., using crypto.randomUUID() or a simple counter/timestamp for basic uniqueness): const newEditorId = editor-${crypto.randomUUID()};.

        Create a new Tab object: { id: newEditorId, title: 'New Recipe', type: 'recipeEditor', isCloseable: true, recipeId: undefined }. // No recipeId initially

        Update the tabs state by adding the new tab.

        Update the activeTabId state to newEditorId.

    Pass handleOpenNewRecipeEditor down as a prop to TabBar.

Modification of frontend/src/components/tabs/TabBar.tsx:

    Accept the onOpenNewRecipeEditor: () => void prop.

    Add a styled button (e.g., with a "+" icon or text "New Recipe") next to the list of tabs.

    Attach the onOpenNewRecipeEditor handler to the button's onClick event.

Modification of frontend/src/components/tabs/TabContent.tsx:

    Add a new condition to the rendering logic:

      
if (activeTab.type === 'recipeEditor') {
  // Pass recipeId if editing, undefined if new
  // return <RecipeEditorTab recipeId={activeTab.recipeId} />; // Implement RecipeEditorTab next
  return <div>Recipe Editor Placeholder (ID: {activeTab.id}, RecipeID: {activeTab.recipeId ?? 'New'})</div>;
}

    

Manual Testing Note

After implementing, restart the Vite dev server.

    Verify a "New Recipe" or "+" button is visible in the tab bar area.

    Click the button.

    Verify a new tab titled "New Recipe" appears and becomes active.

    Verify the content area shows the "Recipe Editor Placeholder" text, indicating it's a new recipe editor instance.

    Verify the new tab is closeable (close button functionality TBD, but isCloseable should be true).

    Check console for errors.