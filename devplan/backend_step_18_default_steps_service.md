# Backend Step 18: Implement Default Steps Service

## Task Description
Create the service layer logic for retrieving default recipe steps based on the category ('ice cream' or 'sorbet'). This service will interact with the `DefaultSteps` model.

## Files to Read
*   `src/models/DefaultSteps.ts` (To import the model and interface)

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/services/defaultStepsService.ts` file.
*   Content of `src/services/defaultStepsService.ts` should include:
    *   Importing the `DefaultSteps` model and `IDefaultSteps` interface from `../models/DefaultSteps`.
    *   Exported asynchronous arrow function:
        *   `getDefaultStepsByCategory(category: 'ice cream' | 'sorbet'): Promise<string[] | null>`:
            *   Finds the `DefaultSteps` document matching the provided `category`.
            *   If found, returns the `steps` array.
            *   If not found, returns `null`.
            *   Includes basic try/catch for database errors.
    *   (Optional) Functions to create/update default steps if management via API is desired, though manual seeding might be sufficient.

## Manual Testing Note
After implementing, verify the file `src/services/defaultStepsService.ts` exists. Run `pnpm tsc` for compilation checks. Testing requires seeding data into the `defaultsteps` collection in MongoDB (e.g., using `mongosh` or Compass) with documents for 'ice cream' and 'sorbet' categories and their respective steps arrays. Then, testing can proceed once the controller and routes are added.