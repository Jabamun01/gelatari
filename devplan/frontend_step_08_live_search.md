# Frontend Step 8: Implement Live Search Functionality

## Task Description
Implement the live search feature within the `SearchTab` component. Use `@tanstack/react-query`'s `useQuery` hook to fetch recipe results from the backend API (`/api/recipes`) as the user types into the search input. Debounce the input to avoid excessive API calls. Display the names of the matching recipes in a list below the search bar. Handle loading and error states.

## Files to Read
*   `frontend/src/components/search/SearchTab.tsx` (To modify, created in step 6)
*   `frontend/src/App.tsx` (Provides context on overall structure, state management location)
*   `frontend/package.json` (To confirm @tanstack/react-query is installed)
*   `frontend/src/main.tsx` (To see QueryClient setup from step 7)
*   `frontend/src/styles/global.ts` (For styling results)
## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend. Define necessary types (e.g., for Recipe results) independently in the frontend.

## Deliverables
*   Creation of `frontend/src/api/recipes.ts` (or similar).
    *   Define a type for the expected recipe search result (e.g., `interface RecipeSearchResult { id: string; name: string; }`).
    *   Implement an asynchronous arrow function `fetchRecipes(searchTerm: string, typeFilter?: 'ice cream recipe' | 'not ice cream recipe'): Promise<RecipeSearchResult[]>` that:
        *   Constructs the URL for the backend API (`/api/recipes`) including query parameters `searchTerm` and optionally `type`.
        *   Uses `fetch` to make the GET request.
        *   Handles potential network errors and non-OK responses.
        *   Parses the JSON response and returns the data.
*   Modification of `frontend/src/components/search/SearchTab.tsx`:
    *   Import `useQuery` from `@tanstack/react-query`.
    *   Import the `fetchRecipes` function.
    *   Implement debouncing for the search input value state (e.g., using `useState` for the raw input and another `useState` for the debounced value updated via `useEffect` with `setTimeout`).
    *   Use the `useQuery` hook:
        *   `queryKey`: An array depending on the *debounced* search term and the search scope toggle state (e.g., `['recipes', debouncedSearchTerm, searchAll]`).
        *   `queryFn`: Calls `fetchRecipes` with the debounced term and the appropriate type filter based on the `searchAll` toggle state.
        *   `enabled`: Set to `true` only when the `debouncedSearchTerm` has a minimum length (e.g., `debouncedSearchTerm.length >= 2`).
    *   Render the search results:
        *   Display a loading indicator when `isLoading` is true.
        *   Display an error message when `isError` is true.
        *   When `data` is available, map over the results array and display each recipe name (e.g., in a list `<ul><li>...</li></ul>`). Make each item clickable (functionality for opening tab comes next).

## Manual Testing Note
After implementing, restart the Vite dev server. Ensure the backend server is running and has some recipe data.
*   Type slowly into the search bar. Verify API calls are made only after pausing typing (debouncing) and only if the term is long enough. Check the network tab in browser dev tools.
*   Verify loading state is shown briefly during fetch.
*   Verify search results matching the term (and scope toggle) are displayed as a list.
*   Test the search scope toggle ("ice cream only" vs "all").
*   Test error states (e.g., stop the backend server and try searching).
*   Clear the search input; the results list should disappear, and no query should be active.