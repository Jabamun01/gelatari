# Frontend Step 6: Implement Search Tab Component Structure

## Task Description
Create the actual `SearchTab` component that will be rendered within the `TabContent` area when the "Search" tab is active. This component should include the basic structure: a large search input field and a toggle/checkbox element to switch the search scope (between "ice cream recipes" and "all recipes"). Styling should be applied using Linaria and CSS variables for a clean, usable appearance.

## Files to Read
*   `frontend/src/components/tabs/TabContent.tsx` (To integrate the `SearchTab` component)
*   `frontend/src/styles/global.ts` (To use CSS variables for styling)
*   `frontend/src/types/tabs.ts` (Potentially, though not strictly needed for this component structure)

## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of a directory `frontend/src/components/search/`.
*   Creation of `frontend/src/components/search/SearchTab.tsx`.
*   Content of `SearchTab.tsx`:
    *   Import `React` and `useState` (for input/toggle state).
    *   Import `styled` from `@linaria/react`.
    *   Define styled components for the container, input field, and toggle area using Linaria, referencing CSS variables (`--spacing-unit`, `--primary-color`, etc.). Ensure the input is large and prominent.
    *   Implement the component function `SearchTab`:
        *   Use `useState` to manage the search input value.
        *   Use `useState` to manage the state of the search scope toggle (e.g., boolean `searchAll`).
        *   Render the styled container holding the styled input field (controlled component) and the toggle (e.g., a checkbox input with a label).
*   Modification of `frontend/src/components/tabs/TabContent.tsx`:
    *   Import the `SearchTab` component.
    *   Update the conditional rendering logic: When `activeTab.type === 'search'`, render `<SearchTab />` instead of the placeholder text.

## Manual Testing Note
After implementing, restart the Vite dev server. The "Search" tab should now display the large search input field and the toggle/checkbox for search scope. Typing in the input should update its value. Clicking the toggle should change its state. Verify basic styling is applied. Check for console errors.