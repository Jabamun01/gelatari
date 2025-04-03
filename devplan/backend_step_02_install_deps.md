# Backend Step 2: Install Core Dependencies

## Task Description
Install the core runtime dependencies required for the Express.js backend application using PNPM. This includes Express for the web server framework and Mongoose for MongoDB object modeling.

**Note:** This step involves a CLI command.

## Files to Read
*   `package.json` (To see existing dev dependencies)

## Constraints Reminder
*   Use only arrow functions (=>) for any future JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool (when applicable in later steps).
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Execution of `pnpm add express mongoose` command.
*   Updated `package.json` reflecting the new dependencies.
*   Updated `pnpm-lock.yaml` reflecting the new dependencies.

## Manual Testing Note
After implementing, check the `dependencies` section of `package.json` to ensure `express` and `mongoose` are listed with their versions. Verify that `pnpm-lock.yaml` has been updated or created.