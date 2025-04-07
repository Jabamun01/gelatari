# Frontend Step 3: Set Up Linaria Integration with Vite

## Task Description
Configure the Vite build process to correctly handle Linaria for CSS-in-JS styling. This involves modifying the `frontend/vite.config.ts` file to include the Linaria Vite plugin.

## Files to Read
*   `frontend/vite.config.ts` (To modify, created in step 1)
*   `frontend/package.json` (To confirm `@linaria/vite` is installed from step 2)
## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Modification of `frontend/vite.config.ts`:
    *   Import the `linaria` plugin: `import linaria from '@linaria/vite';`
    *   Add the `linaria()` plugin to the `plugins` array within the `defineConfig` call, ensuring it comes *before* the `react()` plugin for correct processing order. Example:
      ```typescript
      import { defineConfig } from 'vite'
      import react from '@vitejs/plugin-react'
      import linaria from '@linaria/vite';

      // https://vitejs.dev/config/
      export default defineConfig({
        plugins: [
          linaria({
            // Optional Linaria configuration here
            sourceMap: process.env.NODE_ENV !== 'production',
          }),
          react(),
        ],
      })
      ```

## Manual Testing Note
After implementing, restart the Vite development server (`pnpm dev` in the `frontend` directory). Check the browser console for any errors related to Linaria or Vite configuration. Create a simple component using Linaria's `styled` syntax (in a later step) to verify styles are being generated and applied correctly.