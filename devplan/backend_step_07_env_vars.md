# Backend Step 7: Set Up Environment Variable Handling

## Task Description
Implement basic environment variable handling to configure the application, specifically the database connection string and the server port. Install the `dotenv` package to load variables from a `.env` file during development. Update the database connection logic and server startup logic to use these environment variables, providing sensible defaults. Ensure the `.env` file is ignored by Git.

## Files to Read
*   `src/config/db.ts` (To update DB URI usage)
*   `src/server.ts` (To update port usage and load dotenv)
*   `.gitignore` (To add `.env`)
*   `package.json` (To add `dotenv` dependency)

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Execution of `pnpm add dotenv` command.
*   Creation of a `.env` file in the project root (`/home/patata/Documents/receptari`) containing:
    ```
    DATABASE_URI=mongodb://localhost:27017/iceCreamWorkshop
    PORT=3001
    ```
*   Update `.gitignore` to include the line `.env`.
*   Modification of `src/config/db.ts`:
    *   Import `dotenv` and call `dotenv.config()` (or ensure it's called early in `server.ts`).
    *   Use `process.env.DATABASE_URI` instead of the hardcoded string, potentially providing the hardcoded string as a default fallback (e.g., `process.env.DATABASE_URI || 'mongodb://localhost:27017/iceCreamWorkshop'`).
*   Modification of `src/server.ts`:
    *   Import `dotenv` and call `dotenv.config()` at the very top of the file.
    *   Use `process.env.PORT` for the server port, providing a default fallback (e.g., `process.env.PORT || 3001`).

## Manual Testing Note
After implementing, modify the `PORT` value in the `.env` file (e.g., to 3002). Run the server (`pnpm ts-node src/server.ts`). Verify that the server starts and logs that it's listening on the port specified in `.env` (e.g., 3002). Ensure the database connection is still successful using the URI from `.env`. Check that `.env` is correctly listed in `.gitignore`.