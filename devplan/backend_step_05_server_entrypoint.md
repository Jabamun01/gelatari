# Backend Step 5: Create Basic Express Server Entry Point

## Task Description
Create the main server entry point file at `src/server.ts`. This file will initialize an Express application instance, define a basic root route (e.g., `/` returning a simple health check message), and start the server listening on a specified port (initially hardcoded, will be configured later).

## Files to Read
*   None (Creating a new file).

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/server.ts` file.
*   Content of `src/server.ts` should include:
    *   Importing `express`.
    *   Creating an `express` application instance (`const app = express();`).
    *   Defining a port (e.g., `const PORT = 3001;`).
    *   A simple GET route for `/` (e.g., `app.get('/', (req, res) => res.send('Server is running'));`).
    *   Starting the server using `app.listen(PORT, () => { console.log(...) });`.

## Manual Testing Note
After implementing, try running the server using `pnpm ts-node src/server.ts` (or compile with `pnpm tsc` and run `node dist/server.js`). Access `http://localhost:3001/` in a browser or using `curl` to see if you get the "Server is running" message.