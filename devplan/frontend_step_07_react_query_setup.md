# Frontend Step 7: Set Up @tanstack/react-query Provider

## Task Description
Integrate `@tanstack/react-query` into the application by creating a `QueryClient` instance and wrapping the root `App` component with the `QueryClientProvider`. This makes the query client available throughout the component tree.

## Files to Read
*   `frontend/src/main.tsx` (To modify, adding the provider)
*   `frontend/src/App.tsx` (The component being wrapped)
*   `frontend/package.json` (To confirm @tanstack/react-query is installed from step 2)
## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Modification of `frontend/src/main.tsx`:
    *   Import `QueryClient` and `QueryClientProvider` from `@tanstack/react-query`.
    *   Create a new instance of `QueryClient`: `const queryClient = new QueryClient();`
    *   Wrap the existing `<React.StrictMode><App /></React.StrictMode>` (or just `<App />` if StrictMode isn't desired) within the `<QueryClientProvider client={queryClient}>`. Example:
      ```typescript
      import React from 'react'
      import ReactDOM from 'react-dom/client'
      import App from './App.tsx'
      import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
      // Import global styles if done here
      // import './styles/global.ts'; // Or wherever global styles are applied

      const queryClient = new QueryClient();

      ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </React.StrictMode>,
      )
      ```

## Manual Testing Note
After implementing, restart the Vite dev server. The application should load and function exactly as before (displaying the Search tab with input). Check the browser console for any errors related to React Query setup. The actual usage of queries will happen in subsequent steps. Consider adding React Query DevTools later for easier debugging.