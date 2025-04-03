# Frontend Step 2: Install Core Frontend Dependencies

## Task Description
Install the core dependencies required for the frontend application using PNPM within the `frontend` directory. This includes Linaria for styling, @tanstack/react-query for data fetching and state management, and optionally react-router-dom if explicit routing beyond tabs is anticipated (though tabs are primary).

**Note:** This step involves CLI commands executed within the `frontend` subdirectory.

## Files to Read
*   `frontend/package.json` (To see existing dependencies)

## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool (when applicable in later steps).
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Execution of `pnpm add @linaria/core @linaria/react @linaria/vite @tanstack/react-query` within the `frontend` directory.
*   (Optional: `pnpm add react-router-dom`)
*   Updated `frontend/package.json` reflecting the new dependencies.
*   Updated `frontend/pnpm-lock.yaml`.

## Manual Testing Note
After implementing, check the `dependencies` section of `frontend/package.json` to ensure `@linaria/core`, `@linaria/react`, `@linaria/vite`, and `@tanstack/react-query` are listed. Verify that `frontend/pnpm-lock.yaml` has been updated.