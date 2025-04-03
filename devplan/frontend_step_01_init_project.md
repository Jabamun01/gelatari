# Frontend Step 1: Initialize Project with Vite, React, TS, and PNPM

## Task Description
Initialize a new React frontend project within a subdirectory named `frontend` inside the current project root (`/home/patata/Documents/receptari`). Use Vite as the build tool with the `react-ts` template. Use PNPM for package management throughout.

**Note:** This step primarily involves CLI commands executed within the `frontend` subdirectory.

## Files to Read
*   None (This is the initial setup step for the frontend).

## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool (when applicable in later steps).
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `frontend` subdirectory.
*   Execution of the Vite initialization command within the `frontend` directory (e.g., `pnpm create vite . --template react-ts`). The `.` indicates the current directory (`frontend`).
*   Execution of `pnpm install` within the `frontend` directory to install initial dependencies.
*   Expected Files/Folders within `/home/patata/Documents/receptari/frontend`:
    *   `package.json`
    *   `pnpm-lock.yaml`
    *   `vite.config.ts`
    *   `tsconfig.json`
    *   `src/` directory with standard Vite React TS template files (`main.tsx`, `App.tsx`, etc.)
    *   `public/` directory
    *   `.gitignore` (specific to frontend)

## Manual Testing Note
After implementing, verify that the `frontend` directory exists and contains the standard Vite React TS project structure. Navigate into the `frontend` directory in your terminal and run `pnpm dev`. The default Vite React app should start and be accessible in your browser (usually at `http://localhost:5173`).