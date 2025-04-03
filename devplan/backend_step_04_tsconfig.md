# Backend Step 4: Configure TypeScript (`tsconfig.json`)

## Task Description
Create and configure the `tsconfig.json` file in the project root (`/home/patata/Documents/receptari`). This file specifies the root files and the compiler options required to compile the TypeScript project. Configure it for a modern Node.js environment, outputting compiled JavaScript to a `dist` directory.

## Files to Read
*   `package.json` (To potentially inform target ECMAScript version, though ES2020 or newer is generally safe)

## Constraints Reminder
*   Use only arrow functions (=>) for any future JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of `tsconfig.json` in the project root.
*   Configuration within `tsconfig.json` including:
    *   `target`: e.g., "ES2020" or newer
    *   `module`: "CommonJS" (typical for Node.js/Express unless using ES Modules)
    *   `outDir`: "./dist"
    *   `rootDir`: "./src"
    *   `strict`: true
    *   `esModuleInterop`: true
    *   `skipLibCheck`: true
    *   `forceConsistentCasingInFileNames`: true
    *   `resolveJsonModule`: true (useful for importing JSON files like config)
    *   `include`: ["src/**/*"]
    *   `exclude`: ["node_modules", "**/*.spec.ts"] (if planning tests later)

## Manual Testing Note
After implementing, verify that `tsconfig.json` exists in the project root and contains appropriate compiler options. Try running `pnpm tsc` (or `npx tsc`) to see if it compiles without errors (it might complain about no input files yet, which is fine at this stage).