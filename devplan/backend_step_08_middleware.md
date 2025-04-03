# Backend Step 8: Add Basic Middleware (JSON Parser, CORS)

## Task Description
Configure essential middleware for the Express application. Install the `cors` package to handle Cross-Origin Resource Sharing and enable the built-in `express.json()` middleware to parse incoming JSON request bodies. Apply these middlewares globally in `src/server.ts`.

## Files to Read
*   `src/server.ts` (To add middleware usage)
*   `package.json` (To add `cors` dependency)

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Execution of `pnpm add cors` command.
*   Execution of `pnpm add -D @types/cors` command.
*   Modification of `src/server.ts`:
    *   Import `cors`.
    *   Add `app.use(cors());` *before* defining routes.
    *   Add `app.use(express.json());` *before* defining routes.

## Manual Testing Note
After implementing, run the server (`pnpm ts-node src/server.ts`). The server should start without errors. While direct testing of CORS requires a frontend client, ensure the server runs. You can later test JSON parsing by creating a POST endpoint that expects a JSON body and sending a request using `curl` or a similar tool.