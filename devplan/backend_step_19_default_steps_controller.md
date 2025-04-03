# Backend Step 19: Implement Default Steps Controller

## Task Description
Create the controller layer for handling HTTP requests to fetch default recipe steps. This controller will parse the category from the request parameters and use the `defaultStepsService` to retrieve the corresponding steps.

## Files to Read
*   `src/services/defaultStepsService.ts` (To import service function)

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/controllers/defaultStepsController.ts` file.
*   Content of `src/controllers/defaultStepsController.ts` should include:
    *   Importing `Request`, `Response` from `express`.
    *   Importing `getDefaultStepsByCategory` from `../services/defaultStepsService`.
    *   Exported asynchronous arrow function:
        *   `getDefaultStepsHandler(req: Request, res: Response)`:
            *   Extracts the `category` from `req.params`.
            *   Validates that the category is either 'ice cream' or 'sorbet'. Sends 400 if invalid.
            *   Calls `getDefaultStepsByCategory` with the validated category.
            *   If steps are found, sends 200 response with the steps array.
            *   If steps are not found (service returns null), sends 404 response.
            *   Includes try/catch for service errors, sending 500 response.

## Manual Testing Note
After implementing, verify the file `src/controllers/defaultStepsController.ts` exists. Run `pnpm tsc` for compilation checks. Testing requires seeding data (as mentioned in the previous step) and defining/mounting the corresponding route (next step).