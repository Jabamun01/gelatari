# Backend Step 1: Initialize Project with PNPM and TypeScript

## Task Description
Initialize a new Node.js project within the current directory (`/home/patata/Documents/receptari`). The project should be set up using PNPM for package management and configured for TypeScript development. Create a basic `.gitignore` file suitable for a Node.js project.

**Note:** While this step primarily involves CLI commands, the subsequent steps will involve code generation adhering to the project constraints.

## Files to Read
*   None (This is the initial setup step).

## Constraints Reminder
*   Use only arrow functions (=>) for any future JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool (when applicable in later steps).
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Execution of `pnpm init` command.
*   Execution of commands to install TypeScript and necessary types as dev dependencies (`pnpm add -D typescript @types/node @types/express ts-node nodemon`).
*   Creation of a basic `.gitignore` file (e.g., ignoring `node_modules`, `.env`, `dist`).
*   Expected Files:
    *   `package.json`
    *   `pnpm-lock.yaml` (will be generated after dependency installation in the next step)
    *   `.gitignore`

## Manual Testing Note
After implementing, verify that `package.json` and `.gitignore` files have been created in the `/home/patata/Documents/receptari` directory. Check that `package.json` contains basic project information.