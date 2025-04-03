# Backend Step 6: Implement MongoDB Connection Logic

## Task Description
Create a configuration file (`src/config/db.ts`) responsible for establishing the connection to the MongoDB database using Mongoose. This module should export an asynchronous function that connects to the database. For now, the MongoDB connection URI can be hardcoded, but plan for it to be configurable via environment variables later. Include basic error handling for the connection attempt.

## Files to Read
*   None (Creating a new file).

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/config/db.ts` file.
*   Content of `src/config/db.ts` should include:
    *   Importing `mongoose`.
    *   Defining the MongoDB connection URI (e.g., `mongodb://localhost:27017/iceCreamWorkshop`).
    *   An exported asynchronous arrow function (e.g., `connectDB`) that:
        *   Uses `mongoose.connect()` with the URI.
        *   Logs a success message upon successful connection.
        *   Uses a try/catch block to handle connection errors, logs the error, and potentially exits the process (`process.exit(1)`).

## Manual Testing Note
After implementing, import and call the `connectDB` function from within `src/server.ts` *before* starting the Express server (`app.listen`). Ensure you have a local MongoDB server running. Run the server (`pnpm ts-node src/server.ts`) and check the console output for the connection success message or any connection errors.