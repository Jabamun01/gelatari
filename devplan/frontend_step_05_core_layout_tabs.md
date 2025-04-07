# Frontend Step 5: Implement Core Layout and Basic Tab Structure

## Task Description
Modify the main `App.tsx` component to establish the core application layout, consisting of a container for the tab bar and another for the active tab's content. Implement a basic `TabManager` (using `useState` initially, can be refactored to Context/Reducer later if complexity grows) to manage the state of open tabs. Create initial `TabBar` and `TabContent` components. The application should start with a single, non-closable "Search" tab.

## Files to Read
*   `frontend/src/App.tsx` (To modify, created by Vite in step 1)
*   `frontend/src/styles/global.ts` (To use defined CSS variables, created in step 4)
*   `frontend/src/main.tsx` (Entry point context)
*   `frontend/package.json` (To see React is installed)
## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of a directory structure for tab components, e.g., `frontend/src/components/tabs/`.
*   Definition of a TypeScript type/interface for a Tab, e.g., in `frontend/src/types/tabs.ts`:
    ```typescript
    export type TabType = 'search' | 'recipe';

    export interface Tab {
      id: string; // Unique identifier for the tab instance (e.g., generated UUID or 'search' for the static one)
      title: string; // Text displayed on the tab
      type: TabType;
      recipeId?: string; // Only present if type is 'recipe'
      isCloseable: boolean;
    }
    ```
*   Modification of `frontend/src/App.tsx`:
    *   Import necessary components (`TabBar`, `TabContent`).
    *   Use `useState` to manage the list of open tabs (`Tab[]`) and the ID of the currently active tab (`string`).
    *   Initialize the tabs state with a single Search tab: `[{ id: 'search', title: 'Search', type: 'search', isCloseable: false }]`.
    *   Initialize the active tab ID state to `'search'`.
    *   Render the main layout structure (e.g., using styled divs from Linaria) containing `TabBar` and `TabContent`.
    *   Pass tabs, activeTabId, and functions to set the active tab (`setActiveTabId`) down to `TabBar`.
    *   Pass the *active* tab object down to `TabContent`.
*   Creation of `frontend/src/components/tabs/TabBar.tsx`:
    *   Accepts `tabs: Tab[]`, `activeTabId: string`, `onTabClick: (tabId: string) => void`, `onTabClose: (tabId: string) => void` (implement close later) as props.
    *   Renders a list of styled buttons or divs representing the tabs.
    *   Highlights the active tab using CSS variables (e.g., `--tab-active-bg`, `--tab-inactive-bg`).
    *   Calls `onTabClick` when a tab is clicked.
    *   (Optional: Add close buttons for tabs where `isCloseable` is true - functionality TBD).
*   Creation of `frontend/src/components/tabs/TabContent.tsx`:
    *   Accepts `activeTab: Tab` as props.
    *   Conditionally renders the content based on `activeTab.type`.
    *   For now, just render placeholder text like "Search Content Area" or "Recipe Content Area for ID: {activeTab.recipeId}".

## Manual Testing Note
After implementing, restart the Vite dev server. The application should display a tab bar at the top (or side) with a single "Search" tab, which should appear active. Below the tab bar, the placeholder text "Search Content Area" should be visible. Clicking the "Search" tab should do nothing visually yet, as it's the only tab. Ensure basic layout and styling using CSS variables are applied. Check for console errors.